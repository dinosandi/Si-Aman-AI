using System;
using MediatR;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Domain.Entities;

namespace SiAman.Application.Features.Emergency.Commands.UpdateSosLocation
{
    public class UpdateSosLocationHandler : IRequestHandler<UpdateSosLocationCommand, bool>
    {
        private readonly IEmergencyRepository _emergencyRepo;
        private readonly IEmergencyNotifier _notifier; // ← ganti

        public UpdateSosLocationHandler(
            IEmergencyRepository emergencyRepo,
            IEmergencyNotifier notifier)
        {
            _emergencyRepo = emergencyRepo;
            _notifier = notifier;
        }

        public async Task<bool> Handle(UpdateSosLocationCommand request, CancellationToken ct)
        {
            await _emergencyRepo.AddLocationAsync(new EmergencyLocations
            {
                Id = Guid.NewGuid(),
                AlertId = request.AlertId,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                RecordedAt = DateTimeOffset.UtcNow,
            }, ct);

            await _notifier.NotifySosLocationUpdatedAsync(new
            {
                alertId = request.AlertId,
                latitude = request.Latitude,
                longitude = request.Longitude,
                recordedAt = DateTimeOffset.UtcNow,
            }, ct);

            return true;
        }
    }


}

