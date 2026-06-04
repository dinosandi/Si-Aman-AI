using MediatR;
using NetTopologySuite.Geometries;
using SiAman.Domain.Entities;
using SiAman.Domain.Enums;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Features.Incidents.DTOs;
using SiAman.Application.Common.Models;


namespace SiAman.Application.Features.Incidents.Commands.CreateIncident
{

    public class CreateIncidentHandler : IRequestHandler<CreateIncidentCommand, ApiResponse<IncidentResponseDto>>
    {
        private readonly IIncidentRepository _incidentRepository;
        private readonly IUserService _userService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IFileStorageService _fileStorageService;

        public CreateIncidentHandler(IIncidentRepository incidentRepository, IUserService userService, ICurrentUserService currentUserService, IFileStorageService fileStorageService)
        {
            _incidentRepository = incidentRepository;
            _userService = userService;
            _currentUserService = currentUserService;
            _fileStorageService = fileStorageService;
        }
        public async Task<ApiResponse<IncidentResponseDto>> Handle(
            CreateIncidentCommand request,
            CancellationToken cancellationToken)
        {
            var userId = _currentUserService.UserId;

            if (userId == null || userId == Guid.Empty)
            {
                return ApiResponse<IncidentResponseDto>
                    .Failure("User tidak ditemukan");
            }

            // Upload image — folder per bulan agar tidak menumpuk
            var folder = $"incidents/{DateTime.UtcNow:yyyy-MM}";
            var ImageUrl = await _fileStorageService.SaveAsync(request.Image, folder, cancellationToken);

            var incident = new SiAman.Domain.Entities.Incidents
            {
                Id = Guid.NewGuid(),
                UserId = userId.Value,
                Type = request.Type,
                Other = request.Other,
                Description = request.Description,
                LocationDescription = request.LocationDescription,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                ImageUrl = ImageUrl,
                Status = StatusIncidents.MenungguVerifikasi,
                Geom = new Point(request.Longitude ?? 0, request.Latitude ?? 0) { SRID = 4326 },
                ReportedAt = DateTimeOffset.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };


            await _incidentRepository.CreateIncidentAsync(
                incident,
                cancellationToken);

            var response = new IncidentResponseDto
            {
                Id = incident.Id,
                Type = incident.Type,
                Description = incident.Description,
                ImageUrl = incident.ImageUrl,
                Latitude = incident.Latitude,
                Longitude = incident.Longitude,
                Status = incident.Status,
                ReportedAt = incident.ReportedAt
            };

            return
                new ApiResponse<IncidentResponseDto>
                {
                    Data = response,
                    Message = "Laporan berhasil dibuat",
                    Success = true
                };
        }

    }

}

