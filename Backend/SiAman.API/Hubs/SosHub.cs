using System;
using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SiAman.Application.Common.Interfaces.Repository;
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
    private readonly IEmergencyRepository _emergencyRepo;

    public SosHub(IMediator mediator, IEmergencyRepository emergencyRepo)
    {
        _mediator = mediator;
        _emergencyRepo = emergencyRepo;
    }

    public override async Task OnConnectedAsync()
    {
        // Admin otomatis masuk group
        var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (role == nameof(Role.Admin))
            await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");

        await base.OnConnectedAsync();
    }

    // ── User: tekan tombol SOS ─────────────────────────────────────
    public async Task<Guid> TriggerSos(double latitude, double longitude)
    {
        var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                     ?? Context.User?.FindFirst("sub")?.Value 
                     ?? Context.UserIdentifier;
        
        Console.WriteLine($"[DEBUG SosHub] TriggerSos - userIdStr: '{userIdStr}'");

        Guid? userId = null;
        if (Guid.TryParse(userIdStr, out var parsedUserId))
        {
            userId = parsedUserId;
        }
        else
        {
            Console.WriteLine($"[DEBUG SosHub] TriggerSos - failed to parse Guid from '{userIdStr}'");
        }

        var result = await _mediator.Send(new TriggerSosCommand(latitude, longitude, userId));
        if (!result.Success) throw new HubException(result.Message);

        Context.Items["AlertId"] = result.Data; // simpan di session
        await Clients.Caller.SendAsync("SosConfirmed", result.Data);
        return result.Data;
    }

    // ── User: update lokasi real-time (panggil tiap ~5 detik) ──────
    public async Task UpdateSosLocation(double latitude, double longitude)
    {
        Guid alertId = Guid.Empty;
        if (Context.Items.TryGetValue("AlertId", out var obj) && obj is Guid aid)
        {
            alertId = aid;
        }
        else
        {
            var userIdStr = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                         ?? Context.User?.FindFirst("sub")?.Value 
                         ?? Context.UserIdentifier;
            
            Console.WriteLine($"[DEBUG SosHub] UpdateSosLocation - userIdStr: '{userIdStr}'");

            if (Guid.TryParse(userIdStr, out var userId))
            {
                var activeAlert = await _emergencyRepo.GetActiveByUserAsync(userId, default);
                if (activeAlert != null)
                {
                    alertId = activeAlert.Id;
                    Context.Items["AlertId"] = alertId;
                    Console.WriteLine($"[DEBUG SosHub] UpdateSosLocation - found active alert: {alertId}");
                }
                else
                {
                    Console.WriteLine($"[DEBUG SosHub] UpdateSosLocation - no active alert in DB for user {userId}");
                }
            }
            else
            {
                Console.WriteLine($"[DEBUG SosHub] UpdateSosLocation - failed to parse Guid from '{userIdStr}'");
            }
        }

        if (alertId == Guid.Empty)
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


