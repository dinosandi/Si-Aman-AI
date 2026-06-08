using MediatR;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Common.Models;
using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Emergency.Commands.ResolveSos
{
public class ResolveSosHandler : IRequestHandler<ResolveSosCommand, ApiResponse<bool>>
{
    private readonly IEmergencyRepository _emergencyRepo;
    private readonly IEmergencyNotifier   _notifier; // ← ganti

    public ResolveSosHandler(IEmergencyRepository emergencyRepo, IEmergencyNotifier notifier)
    {
        _emergencyRepo = emergencyRepo;
        _notifier      = notifier;
    }

    public async Task<ApiResponse<bool>> Handle(ResolveSosCommand request, CancellationToken ct)
    {
        var alert = await _emergencyRepo.GetByIdAsync(request.AlertId, ct);
        if (alert is null)
            return ApiResponse<bool>.Failure("Alert tidak ditemukan");

        alert.Status      = StatusAlerts.Terselesaikan;
        alert.ReslolvedAt = DateTimeOffset.UtcNow;
        await _emergencyRepo.UpdateAsync(alert, ct);

        await _notifier.NotifySosResolvedAsync(
            new { alertId = request.AlertId }, ct);

        return ApiResponse<bool>.SuccessResponse(true, "SOS diselesaikan");
    }
}

}

