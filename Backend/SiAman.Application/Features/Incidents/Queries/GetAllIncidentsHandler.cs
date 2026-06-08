using MediatR;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Incidents.DTOs;
using SiAman.Domain.Enums;

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

            var incidents = await _incidentsRepository.GetAllIncidentsAsync(cancellationToken);

            var response = incidents.Select(incident => new IncidentResponseDto
            {
                Id = incident.Id,
                ReporterName = incident.User?.Name
                    ?? "Unknown User",
                Type = incident.Type,
                Other = incident.Other,
                Description = incident.Description,
                LocationDescription =
                    incident.LocationDescription,
                Latitude = incident.Latitude,
                Longitude = incident.Longitude,
                ImageUrl = incident.ImageUrl,
                Status = incident.Status,
                ReportedAt = incident.ReportedAt,
                ResolvedAt = incident.ResolvedAt,
                UpdatedAt = incident.UpdatedAt,
                CreatedAt = incident.CreatedAt,
                ValidVotes = incident.Votes
                    .Count(v =>
                        v.Type == TypeVote.Fakta),

                InvalidVotes = incident.Votes
                    .Count(v =>
                        v.Type == TypeVote.Hoax),

                TotalVotes = incident.Votes.Count,
                Votes = incident.Votes
                    .Select(vote => new IncidentVoteUserDto
                    {
                        UserId = vote.UserId,
                        UserName = vote.User?.Name
                            ?? "Unknown User",
                        VoteType = vote.Type,
                        CreatedAt = vote.CreatedAt
                    })
                    .OrderByDescending(v => v.CreatedAt)
                    .ToList()
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