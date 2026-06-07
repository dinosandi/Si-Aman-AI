using System;
using NetTopologySuite.Geometries;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Common.Models;
using MediatR;
using SiAman.Domain.Entities;
using SiAman.Domain.Enums;
using SiAman.Application.Common.Exceptions;

namespace SiAman.Application.Features.Location.Commands
{
    public class UpdateUserLocationCommandHandler
    {
        public class UpdateUserLocationHandler
        : IRequestHandler<UpdateUserLocationCommand, ApiResponse<bool>>
        {
            private readonly IUserRepository _userRepository;
            private readonly IUserLocationRepository _userLocationRepository;
            private readonly IEmergencyRepository _emergencyRepository;
            private readonly IEmergencyNotifier _notifier;
            private readonly GeometryFactory _geometryFactory;

            public UpdateUserLocationHandler(
                IUserRepository userRepository,
                IUserLocationRepository userLocationRepository,
                IEmergencyRepository emergencyRepository,
                IEmergencyNotifier notifier)
            {
                _userRepository = userRepository;
                _userLocationRepository = userLocationRepository;
                _emergencyRepository = emergencyRepository;
                _notifier = notifier;

                // SRID 4326 = WGS84 (standar GPS)
                _geometryFactory = new GeometryFactory(
                    new PrecisionModel(), 4326);
            }

            public async Task<ApiResponse<bool>> Handle(
                UpdateUserLocationCommand request,
                CancellationToken cancellationToken)
            {
                // Ingat: NTS Point(X=Longitude, Y=Latitude)
                var point = _geometryFactory.CreatePoint(
                    new Coordinate(request.Longitude, request.Latitude));

                // ── 1. Update cache lokasi terkini di tabel Users 
                try
                {
                    await _userRepository.UpdateLocationAsync(request.UserId, request.Latitude, request.Longitude, point, cancellationToken);
                }
                catch (NotFoundException)
                {
                    return ApiResponse<bool>.Failure("User tidak ditemukan");
                }

                // ── 2. Simpan riwayat ke UserLocations 
                var locationHistory = new UserLocations
                {
                    Id = Guid.NewGuid(),
                    UserId = request.UserId,
                    Location = point,
                    Latitude = request.Latitude,
                    Longitude = request.Longitude,
                    Accuracy = request.Accuracy,
                    Speed = request.Speed,
                    Heading = request.Heading,
                    RecordedAt = DateTimeOffset.UtcNow
                };

                await _userLocationRepository.AddAsync(locationHistory);

                // ── 3. Jika user memiliki SOS aktif, simpan juga ke EmergencyLocations dan kirim notifikasi ke Admin
                var activeAlert = await _emergencyRepository.GetActiveByUserAsync(request.UserId, cancellationToken);
                if (activeAlert != null && activeAlert.Status == StatusAlerts.Aktif)
                {
                    await _emergencyRepository.AddLocationAsync(new EmergencyLocations
                    {
                        Id = Guid.NewGuid(),
                        AlertId = activeAlert.Id,
                        Latitude = request.Latitude,
                        Longitude = request.Longitude,
                        RecordedAt = DateTimeOffset.UtcNow,
                    }, cancellationToken);

                    await _notifier.NotifySosLocationUpdatedAsync(new
                    {
                        alertId = activeAlert.Id,
                        latitude = request.Latitude,
                        longitude = request.Longitude,
                        recordedAt = DateTimeOffset.UtcNow,
                    }, cancellationToken);
                }

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Lokasi berhasil diperbarui"
                };
            }
        }
    }
}


