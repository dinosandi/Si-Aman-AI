namespace SiAman.Application.Features.Navigation.DTOs;

public class AlternativeRouteDto
{
    public int    RouteIndex        { get; set; }
    public string RouteName         { get; set; } = string.Empty;  // "Rute Utama", "Alternatif 1", dst
    public double DistanceKm        { get; set; }
    public double DurationMinutes   { get; set; }
    public double AverageSafetyScore { get; set; }
    public string SafetyLevel       { get; set; } = string.Empty;
    public int    SafetyRank        { get; set; }  // 1 = paling aman
    public bool   IsRecommended     { get; set; }  // true untuk rute terbaik
    

    
    public bool   HasIncident         { get; set; }
    public int    IncidentCount       { get; set; }
    public string RouteWarning        { get; set; } = string.Empty;

    public RouteGeometryDto Geometry { get; set; } = new();
    public List<RouteSegmentDto>     Segments        { get; set; } = new();
    public List<NearbyIncidentDto>   NearbyIncidents { get; set; } = new();
}

public class SafeRouteWithAlternativesDto
{
    // Rute yang direkomendasikan (safety score tertinggi)
    public AlternativeRouteDto          RecommendedRoute     { get; set; } = new();

    // Semua alternatif terurut berdasarkan safety score
    public List<AlternativeRouteDto>    AllRoutes            { get; set; } = new();

    public string Summary { get; set; } = string.Empty;  
    // contoh: "3 rute ditemukan. Rute Alternatif 1 paling aman (score: 85)"
}