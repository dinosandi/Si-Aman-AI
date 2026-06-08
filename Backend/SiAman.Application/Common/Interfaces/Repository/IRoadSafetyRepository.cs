using NetTopologySuite.Geometries;
using SiAman.Domain.Entities;

namespace SiAman.Application.Common.Interfaces.Repository
{

    public interface IRoadSafetyRepository
    {
        Task<List<RoadSafetySegments>> GetIntersectedSegmentsAsync(
            Geometry routeGeometry
        );
        Task<HashSet<long>> GetExistingOsmIdsAsync(
           CancellationToken ct = default);

        Task BulkInsertAsync(
            List<RoadSafetySegments> segments,
            CancellationToken ct = default);
        Task<List<RoadSafetySegments>> GetSegmentsBetweenPointsAsync(
    double originLat, double originLng,
    double destinationLat, double destinationLng,
    double bufferDegrees = 0.02);

    }
}

