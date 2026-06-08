using System;

namespace SiAman.Application.Common.Interfaces.Service;

public interface IIncidentNotifier
{
    Task NotifyIncidentCreatedAsync(
        object payload,
        CancellationToken ct = default);

    Task NotifyIncidentVoteUpdatedAsync(
        object payload,
        CancellationToken ct = default);

    Task NotifyIncidentStatusUpdatedAsync(
        object payload,
        CancellationToken ct = default);
}
