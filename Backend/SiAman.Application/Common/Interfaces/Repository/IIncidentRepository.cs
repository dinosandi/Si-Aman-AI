using SiAman.Domain.Entities;


namespace SiAman.Application.Common.Interfaces.Repository
{

    public interface IIncidentRepository
    {
        Task<Incidents> CreateIncidentAsync(Incidents incident, CancellationToken ct = default);
        Task<List<Incidents>> GetNearbyAsync(double lat, double lon, double radiusMeters,
            CancellationToken ct = default);
        Task<Incidents?> GetByIdAsync(Guid id, CancellationToken ct = default);
         Task<List<Incidents>> GetNearbyIncidentsAlongRouteAsync(

        NetTopologySuite.Geometries.Geometry routeGeometry, 

        double bufferDistance);
    }

}

