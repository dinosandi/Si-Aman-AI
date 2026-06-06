using MediatR;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Incidents.DTOs;
using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Incidents.Commands.VoteIncident;

public class VoteIncidentCommand
    : IRequest<ApiResponse<IncidentVoteResultDto>>
{
    public Guid IncidentId { get; set; }

    public TypeVote Type { get; set; }
}