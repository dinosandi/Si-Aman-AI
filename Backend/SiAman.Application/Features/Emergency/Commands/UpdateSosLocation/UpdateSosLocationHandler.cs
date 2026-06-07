using System;
using MediatR;
using NetTopologySuite.Geometries;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Domain.Entities;
using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Emergency.Commands.UpdateSosLocation
{
    public class UpdateSosLocationHandler : IRequestHandler<UpdateSosLocationCommand, bool>
    {
        private readonly IEmergencyRepository _emergencyRepo;
        private readonly IUserRepository _userRepository;
        private readonly IEmergencyNotifier _notifier;
        private readonly GeometryFactory _geometryFactory;

        public UpdateSosLocationHandler(
            IEmergencyRepository emergencyRepo,
            IUserRepository userRepository,
            IEmergencyNotifier notifier)
        {
            _emergencyRepo = emergencyRepo;
            _userRepository = userRepository;
            _notifier = notifier;
            _geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        }

        public async Task<bool> Handle(UpdateSosLocationCommand request, CancellationToken ct)
        {
            var alert = await _emergencyRepo.GetByIdAsync(request.AlertId, ct);
            if (alert == null || alert.Status != StatusAlerts.Aktif)
            {
                return false;
            }

            // Update Users table cache
            var point = _geometryFactory.CreatePoint(new Coordinate(request.Longitude, request.Latitude));
            await _userRepository.UpdateLocationAsync(alert.UserId, request.Latitude, request.Longitude, point, ct);

            // Simpan ke EmergencyLocations
            await _emergencyRepo.AddLocationAsync(new EmergencyLocations
            {
                Id = Guid.NewGuid(),
                AlertId = request.AlertId,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                RecordedAt = DateTimeOffset.UtcNow,
            }, ct);

            // Broadcast ke Admin
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


