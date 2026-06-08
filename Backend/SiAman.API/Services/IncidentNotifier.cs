using Microsoft.AspNetCore.SignalR;
using SiAman.API.Hubs;
using SiAman.Application.Common.Interfaces.Service;

namespace SiAman.API.Services;

public class IncidentNotifier : IIncidentNotifier
{
    private readonly IHubContext<IncidentHub> _hub;

    public IncidentNotifier(
        IHubContext<IncidentHub> hub)
    {
        _hub = hub;
    }

    public async Task NotifyIncidentCreatedAsync(
        object payload,
        CancellationToken ct = default)
    {
        await _hub.Clients.All.SendAsync(
            "IncidentCreated",
            payload,
            ct);
    }

    public async Task NotifyIncidentVoteUpdatedAsync(
        object payload,
        CancellationToken ct = default)
    {
        await _hub.Clients.All.SendAsync(
            "IncidentVoteUpdated",
            payload,
            ct);
    }

    public async Task NotifyIncidentStatusUpdatedAsync(
        object payload,
        CancellationToken ct = default)
    {
        await _hub.Clients.All.SendAsync(
            "IncidentStatusUpdated",
            payload,
            ct);
    }
}