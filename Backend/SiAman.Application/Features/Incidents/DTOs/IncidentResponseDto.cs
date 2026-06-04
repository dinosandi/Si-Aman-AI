using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Incidents.DTOs;

public class IncidentResponseDto
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
}