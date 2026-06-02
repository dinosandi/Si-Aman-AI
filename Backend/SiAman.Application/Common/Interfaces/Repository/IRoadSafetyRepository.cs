using NetTopologySuite.Geometries;
using SiAman.Domain.Entities;

namespace SiAman.Application.Common.Interfaces.Repository
{

    public interface IRoadSafetyRepository
    {
        Task<List<RoadSafetySegments>> GetIntersectedSegmentsAsync(
            Geometry routeGeometry
        );
    }
}

