using System.Text.Json;
using System.Text.Json.Serialization;

namespace SiAman.Application.Features.Navigation.DTOs;

public class OsrmResponse
{
    [JsonPropertyName("routes")]
    public List<OsrmRoute> Routes { get; set; } = [];
}

public class OsrmRoute
{
    [JsonPropertyName("distance")]
    public double Distance { get; set; }

    [JsonPropertyName("duration")]
    public double Duration { get; set; }

    // Simpan sebagai JsonElement dulu, parse ke NTS di OsrmRouteProvider
    [JsonPropertyName("geometry")]
    public JsonElement Geometry { get; set; }
}