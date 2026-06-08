// SiAman.Infrastructure/Repositories/RoadSafetyRepository.cs
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Domain.Entities;
using SiAman.Infrastructure.Persistence;

namespace SiAman.Infrastructure.Repositories
{
    public class RoadSafetyRepository : IRoadSafetyRepository
    {
        private readonly AppDbContext _context;

        public RoadSafetyRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<RoadSafetySegments>> GetIntersectedSegmentsAsync(
            Geometry routeGeometry)
        {
            // Pastikan SRID 4326
            routeGeometry.SRID = 4326;

            Console.WriteLine(routeGeometry.AsText());
            Console.WriteLine(routeGeometry.SRID);

            // ST_DWithin dengan ::geography otomatis pakai meter (bukan derajat)
            // 35 meter toleransi untuk jalan yang sedikit offset dari route line
            const double toleranceMeters = 35.0;

            var wkt = routeGeometry.AsText();

            return await _context.RoadSafetySegments
                .FromSqlRaw(@"
                    SELECT *
                    FROM   ""RoadSafetySegments""
                    WHERE  ST_DWithin(
                               ""Geom""::geography,
                               ST_GeomFromText({0}, 4326)::geography,
                               {1}
                           )",
                    wkt,
                    toleranceMeters)
                .AsNoTracking()
                .ToListAsync();
        }
        public async Task<HashSet<long>> GetExistingOsmIdsAsync(
    CancellationToken ct = default)
        {
            var ids = await _context.RoadSafetySegments
                .Select(r => r.OsmdId)
                .ToListAsync(ct);

            return ids.ToHashSet();
        }

        public async Task BulkInsertAsync(
            List<RoadSafetySegments> segments,
            CancellationToken ct = default)
        {
            if (!segments.Any()) return;

            await _context.RoadSafetySegments.AddRangeAsync(segments, ct);
            await _context.SaveChangesAsync(ct);
        }

        public async Task<List<RoadSafetySegments>> GetSegmentsBetweenPointsAsync(
    double originLat, double originLng,
    double destinationLat, double destinationLng,
    double bufferDegrees = 0.02)
{
    // Bounding box + sedikit buffer agar jalan sekitar ikut masuk
    var minLat = Math.Min(originLat, destinationLat) - bufferDegrees;
    var maxLat = Math.Max(originLat, destinationLat) + bufferDegrees;
    var minLng = Math.Min(originLng, destinationLng) - bufferDegrees;
    var maxLng = Math.Max(originLng, destinationLng) + bufferDegrees;

    var bbox = new Envelope(minLng, maxLng, minLat, maxLat);
    var bboxGeom = new GeometryFactory(new PrecisionModel(), 4326)
        .ToGeometry(bbox);

    return await _context.RoadSafetySegments
        .Where(s => s.Geom.Intersects(bboxGeom))
        .OrderBy(s => s.SafetyScore)
        .ToListAsync();
}


    }
}