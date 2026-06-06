using NetTopologySuite.Geometries;

namespace SiAman.Application.Features.Navigation.DTOs
{

    public class RouteResult
    {
        public double DistanceKm { get; set; }

        public double DurationMinutes { get; set; }

        public string GeometryJson { get; set; } = string.Empty;

        public Geometry RouteGeometry { get; set; } = default!;

        public int RouteIndex { get; set; }   // 0 = primary, 1,2 = alternatif
        public string RouteName { get; set; } = string.Empty;
    
    }

}
