using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Incidents.DTOs
{
    public record IncidentResponseDto
    {
        public Guid Id { get; set; }
        public string ReporterName { get; set; } = string.Empty;
        public TypeIncidents Type { get; set; }
        public string? Other { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? LocationDescription { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public StatusIncidents Status { get; set; }
        public DateTimeOffset ReportedAt { get; set; }
        public DateTimeOffset? UpdatedAt { get; set; }
        public DateTimeOffset? ResolvedAt { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
         public int ValidVotes { get; set; }

        public int InvalidVotes { get; set; }

        public int TotalVotes { get; set; }
        public List<IncidentVoteUserDto> Votes
        { get; set; }
            = new();
    }

}

