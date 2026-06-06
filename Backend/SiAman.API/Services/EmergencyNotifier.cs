using Microsoft.AspNetCore.SignalR;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.API.Hubs;

namespace SiAman.API.Services
{

    public class EmergencyNotifier : IEmergencyNotifier
    {
        private readonly IHubContext<SosHub> _hub;

        public EmergencyNotifier(IHubContext<SosHub> hub) => _hub = hub;

        public Task NotifySosTriggeredAsync(object payload, CancellationToken ct)
            => _hub.Clients.Group("Admins").SendAsync("SosTriggered", payload, ct);

        public Task NotifySosLocationUpdatedAsync(object payload, CancellationToken ct)
            => _hub.Clients.Group("Admins").SendAsync("SosLocationUpdated", payload, ct);

        public Task NotifySosResolvedAsync(object payload, CancellationToken ct)
            => _hub.Clients.Group("Admins").SendAsync("SosResolved", payload, ct);
    }

}
