using MediatR;
using NetTopologySuite.Geometries;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Common.Models;
using SiAman.Application.Common.Services;
using SiAman.Domain.Entities;

namespace SiAman.Application.Features.OsmSeeder.Commands
{
    public class SeedRoadSafetyHandler
        : IRequestHandler<SeedRoadSafetyCommand, ApiResponse<SeedRoadSafetyResultDto>>
    {
        private readonly IOsmDataProvider        _osmProvider;
        private readonly IRoadSafetyRepository   _roadSafetyRepository;
        private readonly GeometryFactory         _geometryFactory;

        public SeedRoadSafetyHandler(
            IOsmDataProvider      osmProvider,
            IRoadSafetyRepository roadSafetyRepository)
        {
            _osmProvider          = osmProvider;
            _roadSafetyRepository = roadSafetyRepository;
            _geometryFactory      = new GeometryFactory(
                new PrecisionModel(), 4326);
        }

        public async Task<ApiResponse<SeedRoadSafetyResultDto>> Handle(
            SeedRoadSafetyCommand command,
            CancellationToken     ct)
        {
            
            List<OsmWayDto> ways;

         try
            {
                ways = await _osmProvider.FetchDangerousRoadsAsync(
                    command.SouthLat, command.WestLon,
                    command.NorthLat, command.EastLon, ct);
            }
            catch (HttpRequestException ex)
            {
                return ApiResponse<SeedRoadSafetyResultDto>.Failure(
                    $"Gagal fetch OSM: {ex.Message}");
            }
           
            // 2. Ambil OsmId yang sudah ada agar tidak duplikat
            var existingOsmIds =
                await _roadSafetyRepository.GetExistingOsmIdsAsync(ct);

            var toInsert = new List<RoadSafetySegments>();

            foreach (var way in ways)
            {
                if (existingOsmIds.Contains(way.OsmId)) continue;

                // Koordinat: NTS pakai (X=Lon, Y=Lat)
                var coordinates = way.Nodes
                    .Select(n => new Coordinate(n.Longitude, n.Latitude))
                    .ToArray();

                if (coordinates.Length < 2) continue;

                var lineString = _geometryFactory
                    .CreateLineString(coordinates);

                var safetyScore = OsmSafetyScoreCalculator.Calculate(way);

                toInsert.Add(new RoadSafetySegments
                {
                    Id           = Guid.NewGuid(),
                    OsmdId       = way.OsmId,
                    Geom         = lineString,
                    Latitude     = way.Nodes.First().Latitude.ToString(),
                    Longitude    = way.Nodes.First().Longitude.ToString(),
                    SafetyScore  = safetyScore,
                    CalculatedAt = DateTimeOffset.UtcNow
                });
            }

            // 3. Bulk insert
            await _roadSafetyRepository.BulkInsertAsync(toInsert, ct);

            return new ApiResponse<SeedRoadSafetyResultDto>
            {
                Data = new SeedRoadSafetyResultDto
                {
                    TotalFetched  = ways.Count,
                    TotalInserted = toInsert.Count,
                    TotalSkipped  = ways.Count - toInsert.Count
                },
                Message = " Seeding completed.",
                Success = true
            };
        }
    }
}