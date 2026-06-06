using MediatR;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Emergency.DTOs;

namespace SiAman.Application.Features.Emergency.Queries.GetActiveAlerts
{
    public class GetActiveAlertsHandler
    : IRequestHandler<GetActiveAlertsQuery, ApiResponse<List<ActiveAlertDto>>>
    {
        private readonly IEmergencyRepository _emergencyRepo;

        public GetActiveAlertsHandler(IEmergencyRepository emergencyRepo)
            => _emergencyRepo = emergencyRepo;

        public async Task<ApiResponse<List<ActiveAlertDto>>> Handle(
            GetActiveAlertsQuery request, CancellationToken ct)
        {
            var alerts = await _emergencyRepo.GetAllActiveWithUserAsync(ct);

            var result = alerts.Select(a =>
            {
                // Ambil lokasi terakhir
                var lastLoc = a.Locations
                    .OrderByDescending(l => l.RecordedAt)
                    .FirstOrDefault();

                return new ActiveAlertDto
                {
                    AlertId = a.Id,
                    UserId = a.UserId,
                    UserName = a.User.Name,
                    PhoneNumber = a.User.PhoneNumber,
                    Latitude = lastLoc?.Latitude ?? 0,
                    Longitude = lastLoc?.Longitude ?? 0,
                    TriggeredAt = a.TriggeredAt,
                };
            }).ToList();

            return ApiResponse<List<ActiveAlertDto>>.SuccessResponse(result);
        }
    }

}

