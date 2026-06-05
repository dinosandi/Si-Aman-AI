// SiAman.Infrastructure/Services/OsmDataProvider.cs
using System.Text.Json;
using SiAman.Application.Common.Interfaces.Service;

namespace SiAman.Infrastructure.Services
{
    public class OsmDataProvider : IOsmDataProvider
    {
        private readonly HttpClient _httpClient;

        public OsmDataProvider(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<List<OsmWayDto>> FetchDangerousRoadsAsync(
            double southLat, double westLon,
            double northLat, double eastLon,
            CancellationToken ct = default)
        {
            var query = $@"[out:json][timeout:60];
(
  way[""highway""][""highway""~""primary|secondary|tertiary|residential""]
     ({southLat.ToString(System.Globalization.CultureInfo.InvariantCulture)},
      {westLon.ToString(System.Globalization.CultureInfo.InvariantCulture)},
      {northLat.ToString(System.Globalization.CultureInfo.InvariantCulture)},
      {eastLon.ToString(System.Globalization.CultureInfo.InvariantCulture)});
);
out body geom;";

Console.WriteLine("Query: " + query); 

            //  FormUrlEncodedContent
            var content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("data", query)
            });

            // ✅ Tambah User-Agent — Overpass API wajib ini
            _httpClient.DefaultRequestHeaders.TryAddWithoutValidation(
                "User-Agent", "SiAman-App/1.0");

            var response = await _httpClient.PostAsync(
                "https://overpass-api.de/api/interpreter", content, ct);

            // Log detail error jika gagal
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(ct);
                throw new HttpRequestException(
                    $"Overpass API error {(int)response.StatusCode}: {errorBody}");
            }

            var json    = await response.Content.ReadAsStringAsync(ct);
            var root    = JsonDocument.Parse(json).RootElement;
            var ways    = new List<OsmWayDto>();

            foreach (var element in root.GetProperty("elements").EnumerateArray())
            {
                if (element.GetProperty("type").GetString() != "way") continue;

                var way = new OsmWayDto
                {
                    OsmId   = element.GetProperty("id").GetInt64(),
                    Highway = element.TryGetProperty("tags", out var tags) &&
                              tags.TryGetProperty("highway", out var hw)
                              ? hw.GetString() ?? "" : "",
                    Tags    = ParseTags(element)
                };

                if (element.TryGetProperty("geometry", out var geom))
                {
                    foreach (var node in geom.EnumerateArray())
                    {
                        way.Nodes.Add(new OsmNodeDto
                        {
                            Latitude  = node.GetProperty("lat").GetDouble(),
                            Longitude = node.GetProperty("lon").GetDouble()
                        });
                    }
                }

                if (way.Nodes.Count >= 2)
                    ways.Add(way);
            }

            return ways;
        }

        private static Dictionary<string, string> ParseTags(JsonElement element)
        {
            var dict = new Dictionary<string, string>();
            if (!element.TryGetProperty("tags", out var tags)) return dict;
            foreach (var tag in tags.EnumerateObject())
                dict[tag.Name] = tag.Value.GetString() ?? "";
            return dict;
        }
    }
}