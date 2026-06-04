namespace SiAman.Application.Features.Navigation.DTOs
{

    public class SafeRouteDto
    {
        public double DistanceKm { get; set; }
        public double DurationMinutes { get; set; }
        public double AverageSafetyScore { get; set; }
        public string SafetyLevel { get; set; } = default!;
        public RouteGeometryDto Geometry { get; set; } = default!;
        public List<RouteSegmentDto> Segments { get; set; } = new();
        public List<NearbyIncidentDto> NearbyIncidents { get; set; } = new();
    }


}
