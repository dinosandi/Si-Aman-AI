

namespace SiAman.Application.Features.Navigation.DTOs
{

    public class SafeRouteDto
    {
        public double DistanceKm { get; set; }

        public double DurationMinutes { get; set; }

        public double AverageSafetyScore { get; set; }

        public string SafetyLevel { get; set; } = string.Empty;

        public string Geometry { get; set; } = string.Empty;

        public List<RouteSegmentDto> Segments { get; set; } = [];
    }
}
