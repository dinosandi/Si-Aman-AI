// SiAman.Infrastructure/Services/DatabaseRouteProvider.cs
using NetTopologySuite.Geometries;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Features.Navigation.DTOs;
using SiAman.Domain.Entities;
using System.Text.Json;

namespace SiAman.Infrastructure.Services;

public class DatabaseRouteProvider : IRouteProvider
{
    private readonly IRoadSafetyRepository _roadSafetyRepository;

    public DatabaseRouteProvider(IRoadSafetyRepository roadSafetyRepository)
    {
        _roadSafetyRepository = roadSafetyRepository;
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
            ?? throw new InvalidOperationException("Tidak ada rute di database.");
    }

    public async Task<List<RouteResult>> GetAlternativeRoutesAsync(
        double originLat, double originLng,
        double destinationLat, double destinationLng,
        int maxAlternatives = 3)
    {
        // Ambil segmen jalan dari PostGIS yang berada dalam bounding box
        // origin → destination (dengan sedikit buffer)
        var segments = await _roadSafetyRepository
            .GetSegmentsBetweenPointsAsync(
                originLat, originLng,
                destinationLat, destinationLng,
                bufferDegrees: 0.02); // ~2km buffer

        if (segments.Count == 0)
            return new List<RouteResult>();

        // Kelompokkan segmen menjadi beberapa rute alternatif
        // Strategi sederhana: cluster berdasarkan jarak lateral ke garis utama
        var routeGroups = ClusterSegmentsIntoRoutes(segments, maxAlternatives);

        var results = new List<RouteResult>();
        for (int i = 0; i < routeGroups.Count; i++)
        {
            var group = routeGroups[i];
            var lineString = BuildLineString(group);
            var geoJson = BuildGeoJson(lineString);

            results.Add(new RouteResult
            {
                RouteIndex      = i,
                RouteName       = i == 0 ? "Rute Utama (DB)" : $"Alternatif {i} (DB)",
                DistanceKm      = EstimateDistanceKm(lineString),
                DurationMinutes = EstimateDurationMinutes(lineString),
                GeometryJson    = geoJson,
                RouteGeometry   = lineString
            });
        }

        return results;
    }

    // Cluster segmen ke beberapa "jalur" berdasarkan lateral offset
    private List<List<RoadSafetySegments>> ClusterSegmentsIntoRoutes(
        List<RoadSafetySegments> segments, int maxRoutes)
    {
        // Simplified: bagi berdasarkan SafetyScore atau road_type
        // Untuk produksi bisa pakai graph traversal / Dijkstra di atas segmen
        var groups = segments
            .GroupBy(s => s.SafetyScore)
            .Take(maxRoutes)
            .Select(g => g.ToList())
            .ToList();

        return groups.Count > 0 ? groups : new List<List<RoadSafetySegments>> { segments };
    }

    private static LineString BuildLineString(List<RoadSafetySegments> segments)
    {
        var coords = segments
            .SelectMany(s => s.Geom.Coordinates)
            .Distinct()
            .ToArray();

        return new GeometryFactory(new PrecisionModel(), 4326)
            .CreateLineString(coords);
    }

    private static string BuildGeoJson(LineString line)
    {
        var coords = line.Coordinates
            .Select(c => $"[{c.X.ToString(System.Globalization.CultureInfo.InvariantCulture)}," +
                         $"{c.Y.ToString(System.Globalization.CultureInfo.InvariantCulture)}]");

        return $@"{{""type"":""LineString"",""coordinates"":[{string.Join(",", coords)}]}}";
    }

    private static double EstimateDistanceKm(LineString line)
    {
        // Haversine sederhana untuk estimasi
        double total = 0;
        for (int i = 0; i < line.Coordinates.Length - 1; i++)
        {
            total += HaversineKm(
                line.Coordinates[i].Y,   line.Coordinates[i].X,
                line.Coordinates[i+1].Y, line.Coordinates[i+1].X);
        }
        return Math.Round(total, 2);
    }

    private static double EstimateDurationMinutes(LineString line)
    {
        // Asumsi 30 km/h rata-rata jalan kota
        return Math.Round(EstimateDistanceKm(line) / 30.0 * 60, 1);
    }

    private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.Sin(dLat/2) * Math.Sin(dLat/2) +
                Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                Math.Sin(dLon/2) * Math.Sin(dLon/2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1-a));
    }
}