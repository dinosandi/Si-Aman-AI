using MediatR;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Incidents.DTOs;

namespace SiAman.Application.Features.Incidents.Queries
{
    public class GetAllIncidentsQueryHandler 
        : IRequestHandler<GetAllIncidentsQuery, ApiResponse<List<IncidentResponseDto>>>
    {
        private readonly IIncidentRepository _incidentsRepository;
        private readonly ICurrentUserService _currentUserService;

        public GetAllIncidentsQueryHandler(
            IIncidentRepository incidentsRepository,
            ICurrentUserService currentUserService)
        {
            _incidentsRepository = incidentsRepository;
            _currentUserService = currentUserService;
        }

        public async Task<ApiResponse<List<IncidentResponseDto>>> Handle(
            GetAllIncidentsQuery request,
            CancellationToken cancellationToken)
        {
            // cek user apakah sudah login atau belum
            var userId = _currentUserService.UserId;

            if (userId == null)
            {
                return ApiResponse<List<IncidentResponseDto>>
                    .Fail("Unauthorized");
            }

            var incidents = await _incidentsRepository.GetAllIncidentsAsync();

            var response = incidents.Select(incident => new IncidentResponseDto
            {
                Id = incident.Id,
                Type = incident.Type,
                Other = incident.Other,
                Description = incident.Description,
                LocationDescription = incident.LocationDescription,
                Latitude = incident.Latitude,
                Longitude = incident.Longitude,
                ImageUrl = incident.ImageUrl,
                Status = incident.Status,
                ReportedAt = incident.ReportedAt,
                UpdatedAt = incident.UpdatedAt,
                ResolvedAt = incident.ResolvedAt,
                CreatedAt = incident.CreatedAt,
                Upvotes = incident.Votes.Count(v => v.Type == Domain.Enums.TypeVote.Fakta),
                Downvotes = incident.Votes.Count(v => v.Type == Domain.Enums.TypeVote.Hoax),
                VotedUserIds = incident.Votes.Select(v => v.UserId).ToList()
            }).ToList();

            return new ApiResponse<List<IncidentResponseDto>>
            {
                Success = true,
                Message = "Data Incidents Berhasil Di Ambil",
                Data = response
            };
        }
    }
}