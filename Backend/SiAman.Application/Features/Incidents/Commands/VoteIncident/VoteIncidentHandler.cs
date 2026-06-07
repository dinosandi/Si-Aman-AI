using MediatR;
using Microsoft.AspNetCore.SignalR;
using NetTopologySuite.Geometries;
using SiAman.Application.Common.Exceptions;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Incidents.DTOs;
using SiAman.Domain.Entities;
using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Incidents.Commands.VoteIncident;

public class VoteIncidentHandler
    : IRequestHandler<
        VoteIncidentCommand,
        ApiResponse<IncidentVoteResultDto>>
{
    private readonly IIncidentRepository _incidentRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUserService;
    private readonly IIncidentNotifier _incidentNotifier;

    public VoteIncidentHandler(
        IIncidentRepository incidentRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUserService,
        IIncidentNotifier incidentNotifier)
    {
        _incidentRepository = incidentRepository;
        _userRepository = userRepository;
        _currentUserService = currentUserService;
        _incidentNotifier = incidentNotifier;
    }

    public async Task<ApiResponse<IncidentVoteResultDto>> Handle(
        VoteIncidentCommand request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        var incident = await _incidentRepository
            .GetByIdAsync(request.IncidentId);

        if (incident == null)
            throw new NotFoundException(
                "Incident tidak ditemukan");

        // Prevent double vote
        var alreadyVote = await _incidentRepository
            .HasUserVotedAsync(
                request.IncidentId,
                userId!.Value);

        if (alreadyVote)
            throw new BadRequestException(
                "Anda sudah vote");

        // Ambil home location user
        var homeLocation = await _userRepository
            .GetUserHomeLocationAsync(userId.Value);

        if (homeLocation == null)
            throw new BadRequestException(
                "Home location belum tersedia");

        // Validasi radius maksimal 2KM
        var distance =
            homeLocation.HomeLocation!
                .Distance(incident.Geom);

        var distanceMeters =
            distance * 111_320;

        if (distanceMeters > 2000)
            throw new BadRequestException(
                "Anda terlalu jauh dari lokasi incident");

        // Save vote
        var vote = new IncidentsVote
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            IncidentId = incident.Id,
            Type = request.Type,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await _incidentRepository
            .AddVoteAsync(vote);

        // Count votes
        var validVotes =
            await _incidentRepository.CountVotesAsync(
                incident.Id,
                TypeVote.Fakta);

        var invalidVotes =
            await _incidentRepository.CountVotesAsync(
                incident.Id,
                TypeVote.Hoax);

        // AUTO VALIDATION
        if (validVotes >= 3)
        {
            incident.Status = StatusIncidents.Terverifikasi;
        }
        else if (invalidVotes >= 5)
        {
            incident.Status = StatusIncidents.Ditolak;
        }

        await _incidentRepository.SaveChangesAsync();

        var result = new IncidentVoteResultDto
        {
            IncidentId = incident.Id,
            ValidVotes = validVotes,
            InvalidVotes = invalidVotes,
            Status = incident.Status.ToString()
        };

        // REALTIME
await _incidentNotifier
    .NotifyIncidentVoteUpdatedAsync(result);


        return ApiResponse<IncidentVoteResultDto>
            .SuccessResponse(
                message: "Vote berhasil",
                data: result
            );
    }
}