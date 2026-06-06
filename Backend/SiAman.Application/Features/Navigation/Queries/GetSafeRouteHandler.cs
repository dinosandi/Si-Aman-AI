using System.Text.Json;
using MediatR;
using NetTopologySuite.Geometries;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Navigation.DTOs;
using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Navigation.Queries;

public class GetSafeRouteHandler
    : IRequestHandler<GetSafeRouteQuery, ApiResponse<SafeRouteWithAlternativesDto>>
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserRepository _userRepository;
    private readonly IRoadSafetyRepository _roadSafetyRepository;
    private readonly IIncidentRepository _incidentRepository;
    private readonly IRouteProvider _routeProvider;
    private readonly ISafetyScoreService _safetyScoreService;

    public GetSafeRouteHandler(
        ICurrentUserService currentUserService,
        IUserRepository userRepository,
        IRoadSafetyRepository roadSafetyRepository,
        IIncidentRepository incidentRepository,
        IRouteProvider routeProvider,
        ISafetyScoreService safetyScoreService)
    {
        _currentUserService = currentUserService;
        _userRepository = userRepository;
        _roadSafetyRepository = roadSafetyRepository;
        _incidentRepository = incidentRepository;
        _routeProvider = routeProvider;
        _safetyScoreService = safetyScoreService;
    }

    public async Task<ApiResponse<SafeRouteWithAlternativesDto>> Handle(
        GetSafeRouteQuery request,
        CancellationToken cancellationToken)
    {
        // ── 1. Validasi user
        var userId = _currentUserService.UserId;

        if (userId == Guid.Empty)
            return ApiResponse<SafeRouteWithAlternativesDto>.Failure("User tidak ditemukan");

        var user = await _userRepository.GetByIdAsync(userId.Value, cancellationToken);

        if (user is null || !user.CurrentLatitude.HasValue || !user.CurrentLongitude.HasValue)
            return ApiResponse<SafeRouteWithAlternativesDto>.Failure(
                "Lokasi real-time user belum tersedia. Pastikan GPS aktif.");

        // ── 2. Ambil semua alternatif route dari OSRM
        var routes = await _routeProvider.GetAlternativeRoutesAsync(
            user.CurrentLatitude.Value,
            user.CurrentLongitude.Value,
            request.DestinationLatitude,
            request.DestinationLongitude,
            request.MaxAlternatives);

        if (routes.Count == 0)
            return ApiResponse<SafeRouteWithAlternativesDto>.Failure(
                "Tidak ada rute yang ditemukan.");

        // ── 3. Evaluasi semua rute secara SEQUENTIAL (hindari DbContext threading issue)
        var evaluated = new List<AlternativeRouteDto>();
        foreach (var route in routes)
        {
            var evaluatedRoute = await EvaluateSingleRouteAsync(route, cancellationToken);
            evaluated.Add(evaluatedRoute);
        }

        // ── 4. Ranking: safety score tertinggi = rank 1
        var ranked = evaluated
       .OrderBy(r => r.NearbyIncidents.Count)     
       .ThenByDescending(r => r.AverageSafetyScore) 
       .ThenBy(r => r.DistanceKm)                  
       .ToList();

        for (int i = 0; i < ranked.Count; i++)
        {
            ranked[i].SafetyRank = i + 1;
            ranked[i].IsRecommended = i == 0;
            ranked[i].RouteName = GenerateRouteName(ranked[i], i);  // ← label dinamis
        }

        // ── 5. Log
        foreach (var r in ranked)
        {
            Console.WriteLine(
                $"[Rank {r.SafetyRank}] {r.RouteName} | " +
                $"Score: {r.AverageSafetyScore} | " +
                $"Jarak: {r.DistanceKm} km | " +
                $"Insiden: {r.NearbyIncidents.Count}");
        }

        // ── 6. Build response
        var result = new SafeRouteWithAlternativesDto
        {
            RecommendedRoute = ranked.First(),
            AllRoutes = ranked,
            Summary = BuildSummary(ranked)
        };

        return new ApiResponse<SafeRouteWithAlternativesDto>
        {
            Message = "Rute alternatif berhasil dihitung",
            Data = result,
            Success = true
        };
    }

    // ── Evaluasi 1 rute: fetch safety data → score → DTO (semua sequential)
    private async Task<AlternativeRouteDto> EvaluateSingleRouteAsync(
        RouteResult route,
        CancellationToken ct)
    {
        var roadSegments = await _roadSafetyRepository
                               .GetIntersectedSegmentsAsync(route.RouteGeometry);

        var incidents = await _incidentRepository
                            .GetNearbyIncidentsAlongRouteAsync(route.RouteGeometry, 200);

        var safetyScore = _safetyScoreService.Calculate(roadSegments, incidents);
        var geometry = JsonSerializer.Deserialize<RouteGeometryDto>(route.GeometryJson);

        var hasIncident = incidents.Count > 0;
        var routeWarning = hasIncident
            ? $"Rute ini melewati {incidents.Count} titik insiden aktif"
            : "Rute ini bebas insiden";

        return new AlternativeRouteDto
        {
            RouteIndex = route.RouteIndex,
            DistanceKm = Math.Round(route.DistanceKm, 2),
            DurationMinutes = Math.Round(route.DurationMinutes, 2),
            AverageSafetyScore = Math.Round(safetyScore, 2),
            SafetyLevel = GetSafetyLevel(safetyScore),

            
            HasIncident = hasIncident,
            IncidentCount = incidents.Count,
            RouteWarning = routeWarning,

            Geometry = geometry ?? new RouteGeometryDto(),

            Segments = roadSegments.Select(x => new RouteSegmentDto
            {
                StartLatitude = x.Geom.Coordinates.First().Y,
                StartLongitude = x.Geom.Coordinates.First().X,
                EndLatitude = x.Geom.Coordinates.Last().Y,
                EndLongitude = x.Geom.Coordinates.Last().X,
                SafetyScore = ConvertSafetyScoreToDouble(x.SafetyScore)
            }).ToList(),

            NearbyIncidents = incidents.Select(x => new NearbyIncidentDto
            {
                Id = x.Id,
                Title = x.LocationDescription,
                Description = x.Description,
                Latitude = x.Geom.Coordinates.First().Y,
                Longitude = x.Geom.Coordinates.First().X,
            }).ToList()
        };
    }
    // ── Helpers
    private static string GenerateRouteName(AlternativeRouteDto route, int index)
    {
        var suffix = route.HasIncident
            ? $"⚠ ({route.IncidentCount} insiden)"
            : "✓ Bebas Insiden";

        return index == 0
            ? $"Rute Rekomendasi {suffix}"
            : $"Alternatif {index} {suffix}";
    }

    private static string BuildSummary(List<AlternativeRouteDto> ranked)
    {
        var best = ranked.First();
        var bebasInsiden = ranked.Count(r => !r.HasIncident);

        return $"{ranked.Count} rute ditemukan, " +
               $"{bebasInsiden} rute bebas insiden. " +
               $"Rekomendasi: \"{best.RouteName}\" " +
               $"(score: {best.AverageSafetyScore}, {best.SafetyLevel})";
    }


    private static string GetSafetyLevel(double score) =>
        score switch
        {
            >= 80 => "Aman",
            >= 50 => "Waspada",
            _ => "Berbahaya"
        };

    private static double ConvertSafetyScoreToDouble(SafetyScore score) =>
        score switch
        {
            SafetyScore.Aman => 100,
            SafetyScore.Waspada => 60,
            SafetyScore.Berbahaya => 20,
            _ => 100
        };
}