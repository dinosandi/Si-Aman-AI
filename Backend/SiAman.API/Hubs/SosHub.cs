using System;
using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SiAman.Application.Features.Emergency.Commands.ResolveSos;
using SiAman.Application.Features.Emergency.Commands.TriggerSos;
using SiAman.Application.Features.Emergency.Commands.UpdateSosLocation;
using SiAman.Domain.Enums;

namespace SiAman.API.Hubs
{

[Authorize]
public class SosHub : Hub
{
    private readonly IMediator _mediator;

    public SosHub(IMediator mediator) => _mediator = mediator;

    public override async Task OnConnectedAsync()
    {
        // Admin otomatis masuk group
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (role == nameof(Role.Admin))
            await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");

        await base.OnConnectedAsync();
    }

    // ── User: tekan tombol SOS ─────────────────────────────────────
    public async Task TriggerSos(double latitude, double longitude)
    {
        var result = await _mediator.Send(new TriggerSosCommand(latitude, longitude));
        if (!result.Success) throw new HubException(result.Message);

        Context.Items["AlertId"] = result.Data; // simpan di session
        await Clients.Caller.SendAsync("SosConfirmed", result.Data);
    }

    // ── User: update lokasi real-time (panggil tiap ~5 detik) ──────
    public async Task UpdateSosLocation(double latitude, double longitude)
    {
        if (!Context.Items.TryGetValue("AlertId", out var obj) || obj is not Guid alertId)
            throw new HubException("Tidak ada SOS aktif");

        // Simpan ke DB
        await _mediator.Send(new UpdateSosLocationCommand(alertId, latitude, longitude));

        // Broadcast langsung ke Admin
        await Clients.Group("Admins").SendAsync("SosLocationUpdated", new
        {
            alertId,
            latitude,
            longitude,
            recordedAt = DateTimeOffset.UtcNow
        });
    }

    // ── Admin: resolve SOS ─────────────────────────────────────────
    public async Task ResolveSos(Guid alertId)
    {
        var result = await _mediator.Send(new ResolveSosCommand(alertId));
        if (!result.Success) throw new HubException(result.Message);
    }
}

}

