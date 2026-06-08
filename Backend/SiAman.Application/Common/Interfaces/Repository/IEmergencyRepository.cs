using SiAman.Domain.Entities;

namespace SiAman.Application.Common.Interfaces.Repository
{
    public interface IEmergencyRepository
    {
        Task<EmergencyAlerts?> GetActiveByUserAsync(Guid userId, CancellationToken ct);
        Task<EmergencyAlerts?> GetByIdAsync(Guid alertId, CancellationToken ct);
        Task<List<EmergencyAlerts>> GetAllActiveWithUserAsync(CancellationToken ct);
        Task AddAsync(EmergencyAlerts alert, CancellationToken ct);
        Task UpdateAsync(EmergencyAlerts alert, CancellationToken ct);
        Task AddLocationAsync(EmergencyLocations loc, CancellationToken ct);
    }
}
