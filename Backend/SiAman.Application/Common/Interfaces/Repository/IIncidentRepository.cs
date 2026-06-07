using SiAman.Domain.Entities;
using SiAman.Domain.Enums;


namespace SiAman.Application.Common.Interfaces.Repository
{

    public interface IIncidentRepository
    {
        Task<Incidents> CreateIncidentAsync(Incidents incident, CancellationToken ct = default);
        Task<List<Incidents>> GetNearbyAsync(double lat, double lon, double radiusMeters,
            CancellationToken ct = default);
        Task<Incidents?> GetByIdAsync(Guid id, CancellationToken ct = default);
        Task<Incidents?> GetByIdTrackedAsync(Guid id, CancellationToken ct = default);
        Task DeleteIncidentAsync(Incidents incident, CancellationToken ct = default);
        Task<List<Incidents>> GetNearbyIncidentsAlongRouteAsync(

        NetTopologySuite.Geometries.Geometry routeGeometry,

        double bufferDistance);

        Task<bool> HasUserVotedAsync(Guid incidentId, Guid userId);

        Task AddVoteAsync(IncidentsVote vote);

        Task<int> CountVotesAsync(Guid incidentId, TypeVote type);
        Task<List<Incidents>> GetAllIncidentsAsync(CancellationToken ct = default);
        Task SaveChangesAsync();

    }

}

