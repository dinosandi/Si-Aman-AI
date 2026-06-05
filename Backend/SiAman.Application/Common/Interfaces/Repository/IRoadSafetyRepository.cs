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
    }
}

