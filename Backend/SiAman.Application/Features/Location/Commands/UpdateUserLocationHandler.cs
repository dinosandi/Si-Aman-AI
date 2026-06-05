using System;
using NetTopologySuite.Geometries;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Models;
using MediatR;
using SiAman.Domain.Entities;

namespace SiAman.Application.Features.Location.Commands
{

    public class UpdateUserLocationCommandHandler
    {
        public class UpdateUserLocationHandler
        : IRequestHandler<UpdateUserLocationCommand, ApiResponse<bool>>
    {
        private readonly IUserRepository         _userRepository;
        private readonly IUserLocationRepository _userLocationRepository;
        private readonly GeometryFactory         _geometryFactory;

        public UpdateUserLocationHandler(
            IUserRepository         userRepository,
            IUserLocationRepository userLocationRepository)
        {
            _userRepository         = userRepository;
            _userLocationRepository = userLocationRepository;

            // SRID 4326 = WGS84 (standar GPS)
            _geometryFactory = new GeometryFactory(
                new PrecisionModel(), 4326);
        }

        public async Task<ApiResponse<bool>> Handle(
            UpdateUserLocationCommand request,
            CancellationToken         cancellationToken)
        {
            var user = await _userRepository.GetByIdAsync(request.UserId, cancellationToken);

            if (user is null)
            {
                return ApiResponse<bool>.Failure("User tidak ditemukan");
            }

            // Ingat: NTS Point(X=Longitude, Y=Latitude)
            var point = _geometryFactory.CreatePoint(
                new Coordinate(request.Longitude, request.Latitude));

            // ── 1. Update cache lokasi terkini di tabel Users 
            user.CurrentLocation          = point;
            user.CurrentLatitude          = request.Latitude;
            user.CurrentLongitude         = request.Longitude;
            user.LastLocationUpdatedAt    = DateTimeOffset.UtcNow;

            await _userRepository.UpdateAsync(user);

            // ── 2. Simpan riwayat ke UserLocations 
            var locationHistory = new UserLocations
            {
                Id         = Guid.NewGuid(),
                UserId     = request.UserId,
                Location   = point,
                Latitude   = request.Latitude,
                Longitude  = request.Longitude,
                Accuracy   = request.Accuracy,
                Speed      = request.Speed,
                Heading    = request.Heading,
                RecordedAt = DateTimeOffset.UtcNow
            };

            await _userLocationRepository.AddAsync(locationHistory);

            return new ApiResponse<bool>
            {
                Success = true,
                Message = "Lokasi berhasil diperbarui"
            };
        }
    }


    }

}

