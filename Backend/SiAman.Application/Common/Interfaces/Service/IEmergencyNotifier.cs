
namespace SiAman.Application.Common.Interfaces.Service
{

    public interface IEmergencyNotifier
    {
        Task NotifySosTriggeredAsync(object payload, CancellationToken ct = default);
        Task NotifySosLocationUpdatedAsync(object payload, CancellationToken ct = default);
        Task NotifySosResolvedAsync(object payload, CancellationToken ct = default);

    }

}
