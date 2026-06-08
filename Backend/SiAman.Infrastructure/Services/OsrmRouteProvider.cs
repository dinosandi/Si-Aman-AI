using System.Globalization;
using System.Text.Json;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using Microsoft.Extensions.Configuration;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Features.Navigation.DTOs;
using NetTopologySuite.Algorithm.Distance;

namespace SiAman.Infrastructure.Services
{
    public class OsrmRouteProvider : IRouteProvider
    {
        private readonly HttpClient _httpClient;

        public OsrmRouteProvider(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClient = httpClientFactory.CreateClient("Osrm");

            // Paksa set BaseAddress jika factory tidak menyediakannya
            if (_httpClient.BaseAddress is null)
            {
                var baseUrl = configuration["Osrm:BaseUrl"] ?? "http://router.project-osrm.org/";
                _httpClient.BaseAddress = new Uri(baseUrl);
            }

            Console.WriteLine($"[OSRM] BaseAddress: {_httpClient.BaseAddress}");
    
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

        // ── Entry point utama
        public async Task<List<RouteResult>> GetAlternativeRoutesAsync(
            double originLat,      double originLng,
            double destinationLat, double destinationLng,
            int    maxAlternatives = 3)
        {
            // ── Step 1: Coba rute langsung dengan alternatives=true
            var url = BuildUrl(originLat, originLng, destinationLat, destinationLng);
            Console.WriteLine($"[OSRM] Requesting: {url}");

            var osrmResponse = await FetchRoutesFromOsrm(url);
            var results      = ParseRoutes(osrmResponse, startIndex: 0);

            Console.WriteLine($"[OSRM] Direct routes found: {results.Count}");

            // ── Step 2: Jika OSRM tidak cukup kembalikan alternatif
            //           (area terbatas / jalan sedikit), generate via waypoint offset
            if (results.Count < maxAlternatives)
            {
                var needed = maxAlternatives - results.Count;

                var synthetic = await GenerateWaypointAlternativesAsync(
                    originLat,      originLng,
                    destinationLat, destinationLng,
                    needed,
                    existingRoutes: results);

                results.AddRange(synthetic);
                Console.WriteLine($"[OSRM] After synthetic: {results.Count} total routes");
            }

            if (results.Count == 0)
                throw new InvalidOperationException("Semua rute gagal di-parse.");

            // Re-index setelah gabung direct + synthetic
            for (int i = 0; i < results.Count; i++)
                results[i].RouteIndex = i;

            return results;
        }

        private async Task<List<RouteResult>> GenerateWaypointAlternativesAsync(
            double originLat,      double originLng,
            double destinationLat, double destinationLng,
            int    count,
            List<RouteResult> existingRoutes)
        {
            // Midpoint antara origin dan destination
            var midLat = (originLat + destinationLat) / 2.0;
            var midLng = (originLng + destinationLng) / 2.0;

            // Bearing tegak lurus (perpendicular) terhadap garis origin→dest
            var bearingRad  = Math.Atan2(destinationLng - originLng, destinationLat - originLat);
            var perpBearing = bearingRad + Math.PI / 2;

            // ~150m per step di latitude -7° Indonesia (1° ≈ 111km)
            const double OffsetDegrees = 0.0015;

            // Urutan offset: kiri, kanan, lebih kiri, lebih kanan, dst.
            double[] offsets = [-1, 1, -2, 2, -3, 3];

            var syntheticResults = new List<RouteResult>();

            // Ambil lebih banyak kandidat untuk antisipasi duplikat / gagal parse
            foreach (var multiplier in offsets.Take(count * 2))
            {
                if (syntheticResults.Count >= count) break;

                var waypointLat = midLat + multiplier * OffsetDegrees * Math.Cos(perpBearing);
                var waypointLng = midLng + multiplier * OffsetDegrees * Math.Sin(perpBearing);

                var url = BuildUrlWithWaypoint(
                    originLat,   originLng,
                    waypointLat, waypointLng,
                    destinationLat, destinationLng);

                Console.WriteLine($"[OSRM] Waypoint alternative (offset {multiplier}x): {url}");

                try
                {
                    var osrmResponse = await FetchRoutesFromOsrm(url);

                    if (osrmResponse?.Routes is null or { Count: 0 })
                        continue;

                    var candidate           = osrmResponse.Routes[0];
                    var (ntsGeometry, geoJson) = ParseGeometry(candidate);

                    // Skip jika rute hampir sama dengan yang sudah ada (Hausdorff < ~55m)
                    var allExistingGeometries = existingRoutes
                        .Select(r => r.RouteGeometry)
                        .Concat(syntheticResults.Select(r => r.RouteGeometry))
                        .ToList();

                    if (IsDuplicateRoute(ntsGeometry, allExistingGeometries))
                    {
                        Console.WriteLine($"[OSRM] Skip duplikat offset {multiplier}x");
                        continue;
                    }

                    var newIndex = existingRoutes.Count + syntheticResults.Count;

                    syntheticResults.Add(new RouteResult
                    {
                        RouteIndex      = newIndex,
                        RouteName       = $"Alternatif {newIndex}",
                        DistanceKm      = candidate.Distance / 1000.0,
                        DurationMinutes = candidate.Duration / 60.0,
                        GeometryJson    = geoJson,
                        RouteGeometry   = ntsGeometry
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[OSRM] Waypoint route gagal (offset {multiplier}x): {ex.Message}");
                }
            }

            return syntheticResults;
        }

        private async Task<OsrmResponse> FetchRoutesFromOsrm(string url)
        {
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            return DeserializeOsrmResponse(json);
        }

        private static List<RouteResult> ParseRoutes(OsrmResponse osrmResponse, int startIndex)
        {
            var results = new List<RouteResult>();

            if (osrmResponse?.Routes is null)
                return results;

            for (int i = 0; i < osrmResponse.Routes.Count; i++)
            {
                try
                {
                    var route                   = osrmResponse.Routes[i];
                    var (ntsGeometry, geoJson)  = ParseGeometry(route);
                    var globalIndex             = startIndex + i;

                    results.Add(new RouteResult
                    {
                        RouteIndex      = globalIndex,
                        RouteName       = globalIndex == 0 ? "Rute Utama" : $"Alternatif {globalIndex}",
                        DistanceKm      = route.Distance / 1000.0,
                        DurationMinutes = route.Duration / 60.0,
                        GeometryJson    = geoJson,
                        RouteGeometry   = ntsGeometry
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[OSRM] Skip rute index {startIndex + i}: {ex.Message}");
                }
            }

            return results;
        }


        // URL tanpa waypoint — alternatives=true, biarkan OSRM cari sendiri
        private static string BuildUrl(
            double originLat,      double originLng,
            double destinationLat, double destinationLng)
        {
            string Fmt(double v) => v.ToString(CultureInfo.InvariantCulture);

            return $"route/v1/driving/" +
                   $"{Fmt(originLng)},{Fmt(originLat)};" +
                   $"{Fmt(destinationLng)},{Fmt(destinationLat)}" +
                   $"?alternatives=true" +
                   $"&geometries=geojson" +
                   $"&overview=full";
        }

        // URL dengan 1 via-point di tengah — alternatives=false karena kita yang manage
        private static string BuildUrlWithWaypoint(
            double originLat,    double originLng,
            double waypointLat,  double waypointLng,
            double destLat,      double destLng)
        {
            string Fmt(double v) => v.ToString(CultureInfo.InvariantCulture);

            return $"route/v1/driving/" +
                   $"{Fmt(originLng)},{Fmt(originLat)};" +
                   $"{Fmt(waypointLng)},{Fmt(waypointLat)};" +
                   $"{Fmt(destLng)},{Fmt(destLat)}" +
                   $"?alternatives=false" +
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

        private static bool IsDuplicateRoute(Geometry candidate, List<Geometry> existing)
        {
            if (existing.Count == 0) return false;

            foreach (var route in existing)
            {
                if (route is null) continue;

                if (DiscreteHausdorffDistance.Distance(candidate, route) < 0.0005)
                    return true;
            }

            return false;
        }
    }
}