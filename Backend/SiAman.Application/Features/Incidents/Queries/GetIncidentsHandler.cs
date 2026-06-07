using MediatR;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Incidents.DTOs;



namespace SiAman.Application.Features.Incidents.Queries
{

public class GetIncidentsHandler
    : IRequestHandler<GetIncidentsQuery, ApiResponse<List<IncidentResponseDto>>>
{
    private readonly IIncidentRepository _incidentRepo;
    private readonly IUserRepository _userRepo;

    public GetIncidentsHandler(
        IIncidentRepository incidentRepo,
        IUserRepository userRepo)
    {
        _incidentRepo = incidentRepo;
        _userRepo = userRepo;
    }

    public async Task<ApiResponse<List<IncidentResponseDto>>> Handle(
        GetIncidentsQuery request,
        CancellationToken cancellationToken)
    {
        var incidents = await _incidentRepo.GetNearbyAsync(
            request.Latitude,
            request.Longitude,
            request.RadiusMeters,
            cancellationToken);

        // Ambil semua userId unik sekali query 
        var userIds = incidents.Select(i => i.UserId).Distinct().ToList();
        var users = new Dictionary<Guid, string>();

        foreach (var uid in userIds)
        {
            var user = await _userRepo.GetByIdAsync(uid, cancellationToken);
            users[uid] = user?.Name ?? "Anonim";
        }

        var result = incidents
            .Select(i => new IncidentResponseDto
            {
                Id = i.Id,
                ReporterName = users.GetValueOrDefault(i.UserId, "Anonim"),
                Type = i.Type,
                Other = i.Other,
                Description = i.Description,
                LocationDescription = i.LocationDescription,
                Latitude = i.Latitude,
                Longitude = i.Longitude,
                ImageUrl = i.ImageUrl,
                Status = i.Status,
                ReportedAt = i.ReportedAt,
                Upvotes = i.Votes.Count(v => v.Type == Domain.Enums.TypeVote.Fakta),
                Downvotes = i.Votes.Count(v => v.Type == Domain.Enums.TypeVote.Hoax),
                VotedUserIds = i.Votes.Select(v => v.UserId).ToList()
            })
            .ToList();

        return ApiResponse<List<IncidentResponseDto>>.SuccessResponse(result);
    }
}

}

