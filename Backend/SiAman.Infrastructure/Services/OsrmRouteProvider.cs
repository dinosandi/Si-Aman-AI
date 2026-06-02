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

        // Inject IHttpClientFactory atau HttpClient via DI
        public OsrmRouteProvider(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<RouteResult> GetSafeRouteAsync(
            double originLat,
            double originLng,
            double destinationLat,
            double destinationLng)
        {
            // Format: /route/v1/driving/{lon},{lat};{lon},{lat}
            var url = $"route/v1/driving/" +
                      $"{originLng.ToString(System.Globalization.CultureInfo.InvariantCulture)}," +
                      $"{originLat.ToString(System.Globalization.CultureInfo.InvariantCulture)};" +
                      $"{destinationLng.ToString(System.Globalization.CultureInfo.InvariantCulture)}," +
                      $"{destinationLat.ToString(System.Globalization.CultureInfo.InvariantCulture)}" +
                      $"?geometries=geojson&overview=full";
                    
            Console.WriteLine($"Requesting OSRM route: {url}");

            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var osrmResponse = JsonSerializer.Deserialize<OsrmResponse>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var route = osrmResponse?.Routes?.FirstOrDefault()
                ?? throw new InvalidOperationException("OSRM tidak mengembalikan rute");

            // Parse GeoJSON geometry → NTS Geometry (untuk query spasial)
            var geoJsonReader = new GeoJsonReader();
            var geometryJson = route.Geometry.ToString() ?? string.Empty;
            var ntsGeometry = geoJsonReader.Read<Geometry>(geometryJson);

            return new RouteResult
            {
                DistanceKm = route.Distance / 1000.0,
                DurationMinutes = route.Duration / 60.0,
                GeometryJson = geometryJson,
                RouteGeometry = ntsGeometry
            };
        }

    }

}
