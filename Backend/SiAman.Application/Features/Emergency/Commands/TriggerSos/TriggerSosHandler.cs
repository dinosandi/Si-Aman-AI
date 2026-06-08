using MediatR;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Emergency.DTOs;
using SiAman.Domain.Entities;
using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Emergency.Commands.TriggerSos
{

    public class TriggerSosHandler : IRequestHandler<TriggerSosCommand, ApiResponse<Guid>>
    {
        private readonly ICurrentUserService _currentUserService;
        private readonly IUserRepository _userRepository;
        private readonly IEmergencyRepository _emergencyRepo;
        private readonly IEmergencyNotifier _notifier;

        public TriggerSosHandler(
            ICurrentUserService currentUserService,
            IUserRepository userRepository,
            IEmergencyRepository emergencyRepo,
            IEmergencyNotifier notifier)
        {
            _currentUserService = currentUserService;
            _userRepository = userRepository;
            _emergencyRepo = emergencyRepo;
            _notifier = notifier;
        }

        public async Task<ApiResponse<Guid>> Handle(
            TriggerSosCommand request, CancellationToken ct)
        {
            var userId = _currentUserService.UserId;
            if (userId is null || userId == Guid.Empty)
                return ApiResponse<Guid>.Failure("User tidak ditemukan");

            // Cegah duplikasi SOS aktif
            var existing = await _emergencyRepo.GetActiveByUserAsync(userId.Value, ct);
            if (existing is not null)
                return ApiResponse<Guid>.Failure("SOS sudah aktif");

            var user = await _userRepository.GetByIdAsync(userId.Value, ct);

            var alert = new EmergencyAlerts
            {
                Id = Guid.NewGuid(),
                UserId = userId.Value,
                Status = StatusAlerts.Aktif,
                TriggeredAt = DateTimeOffset.UtcNow,
            };

            await _emergencyRepo.AddAsync(alert, ct);

            // Simpan lokasi awal
            await _emergencyRepo.AddLocationAsync(new EmergencyLocations
            {
                Id = Guid.NewGuid(),
                AlertId = alert.Id,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                RecordedAt = DateTimeOffset.UtcNow,
            }, ct);

            // Broadcast ke semua Admin — FE langsung terima alert popup
            await _notifier.NotifySosTriggeredAsync(new ActiveAlertDto
            {
                AlertId = alert.Id,
                UserId = userId.Value,
                UserName = user?.Name,
                PhoneNumber = user?.PhoneNumber,
                Address = user?.Address,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                TriggeredAt = alert.TriggeredAt,
                EmergencyContacts = user?.EmergencyContacts?.Select(ec => new EmergencyContactInfoDto
                {
                    ContactName = ec.ContactName,
                    ContactPhone = ec.ContactPhone,
                    Relationship = ec.Relationship,
                    IsPrimary = ec.IsPrimary
                }).ToList() ?? new List<EmergencyContactInfoDto>()
            }, ct);

            return ApiResponse<Guid>.SuccessResponse(alert.Id, "SOS berhasil dikirim");
        }
    }


}

