namespace SiAman.Application.Common.Interfaces.Service
{
    public interface IOsmDataProvider
    {
        Task<List<OsmWayDto>> FetchDangerousRoadsAsync(
            double southLat, double westLon,
            double northLat, double eastLon,
            CancellationToken ct = default);
    }

    public class OsmWayDto
    {
        public long              OsmId      { get; set; }
        public string            Highway    { get; set; } = default!;
        public List<OsmNodeDto>  Nodes      { get; set; } = new();
        public Dictionary<string, string> Tags { get; set; } = new();
    }

    public class OsmNodeDto
    {
        public double Latitude  { get; set; }
        public double Longitude { get; set; }
    }
}