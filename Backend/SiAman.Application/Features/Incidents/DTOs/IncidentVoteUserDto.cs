using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Incidents.DTOs;

public class IncidentVoteUserDto
{
    public Guid UserId { get; set; }

    public string UserName { get; set; }
        = string.Empty;

    public string? UserImage { get; set; }

    public TypeVote VoteType { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}