namespace SiAman.Application.Features.Navigation.DTOs
{
public class RouteSegmentDto
{
    public double StartLatitude { get; set; }
    public double StartLongitude { get; set; }
    public double EndLatitude { get; set; }
    public double EndLongitude { get; set; }
    public double DistanceMeters { get; set; }
    public double SafetyScore { get; set; }
}

}