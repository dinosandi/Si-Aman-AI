using System.Globalization;
using System.Text.Json;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Features.Navigation.DTOs;

namespace SiAman.Infrastructure.Services
{
    public class OsrmRouteProvider : IRouteProvider
    {
        private readonly HttpClient _httpClient;

        public OsrmRouteProvider(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        
        public async Task<RouteResult> GetSafeRouteAsync(
            double originLat, double originLng,
            double destinationLat, double destinationLng)
        {
            var routes = await GetAlternativeRoutesAsync(
                originLat, originLng,
                destinationLat, destinationLng,
                maxAlternatives: 1);

            return routes.FirstOrDefault()
                ?? throw new InvalidOperationException("OSRM tidak mengembalikan rute");
        }

        // ── Method baru: ambil beberapa alternatif 
        public async Task<List<RouteResult>> GetAlternativeRoutesAsync(
            double originLat,      double originLng,
            double destinationLat, double destinationLng,
            int    maxAlternatives = 3)
        {
            var url = BuildUrl(originLat, originLng, destinationLat, destinationLng, maxAlternatives);

            Console.WriteLine($"[OSRM] Requesting alternatives: {url}");

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var json          = await response.Content.ReadAsStringAsync();
            var osrmResponse  = DeserializeOsrmResponse(json);

            if (osrmResponse?.Routes is null || osrmResponse.Routes.Count == 0)
                throw new InvalidOperationException("OSRM tidak mengembalikan rute.");

            var results = new List<RouteResult>();

            for (int i = 0; i < osrmResponse.Routes.Count; i++)
            {
                var route = osrmResponse.Routes[i];

                try
                {
                    var (ntsGeometry, geometryJson) = ParseGeometry(route);

                    results.Add(new RouteResult
                    {
                        RouteIndex      = i,
                        RouteName       = i == 0 ? "Rute Utama" : $"Alternatif {i}",
                        DistanceKm      = route.Distance / 1000.0,
                        DurationMinutes = route.Duration / 60.0,
                        GeometryJson    = geometryJson,
                        RouteGeometry   = ntsGeometry
                    });
                }
                catch (Exception ex)
                {
                    // Jika satu rute gagal di-parse, skip dan lanjut
                    Console.WriteLine($"[OSRM] Skip rute index {i}: {ex.Message}");
                }
            }

            if (results.Count == 0)
                throw new InvalidOperationException("Semua rute gagal di-parse.");

            return results;
        }

        // ── Helpers ────────────────────────────────────────────────────────

        private static string BuildUrl(
            double originLat,      double originLng,
            double destinationLat, double destinationLng,
            int    maxAlternatives)
        {
            // Format koordinat pakai InvariantCulture agar tidak pakai koma desimal
            string Fmt(double v) => v.ToString(CultureInfo.InvariantCulture);

            var alternatives = maxAlternatives > 1 ? "true" : "false";

            return $"route/v1/driving/" +
                   $"{Fmt(originLng)},{Fmt(originLat)};" +
                   $"{Fmt(destinationLng)},{Fmt(destinationLat)}" +
                   $"?alternatives={alternatives}" +
                   $"&geometries=geojson" +
                   $"&overview=full";
        }

        private static OsrmResponse DeserializeOsrmResponse(string json)
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<OsrmResponse>(json, options)
                ?? throw new InvalidOperationException("Gagal deserialize respons OSRM.");
        }

        private static (Geometry ntsGeometry, string geometryJson) ParseGeometry(OsrmRoute route)
        {
            
            var geometryJson = route.Geometry.ToString()
                ?? throw new InvalidOperationException("Geometry kosong.");

            var geoJsonReader = new GeoJsonReader();
            var ntsGeometry   = geoJsonReader.Read<Geometry>(geometryJson);

            return (ntsGeometry, geometryJson);
        }
    }
}