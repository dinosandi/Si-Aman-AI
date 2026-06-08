namespace SiAman.Application.Features.Incidents.DTOs;

public class IncidentVoteResultDto
{
    public Guid IncidentId { get; set; }

    public int ValidVotes { get; set; }

    public int InvalidVotes { get; set; }

    public string Status { get; set; } = default!;
}