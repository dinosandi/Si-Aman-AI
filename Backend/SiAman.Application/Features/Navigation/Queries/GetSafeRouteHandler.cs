using System.Text.Json;
using MediatR;
using NetTopologySuite.Geometries;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Navigation.DTOs;
using SiAman.Domain.Entities;
using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Navigation.Queries;

public class GetSafeRouteHandler
    : IRequestHandler<GetSafeRouteQuery, ApiResponse<SafeRouteDto>>
{
    private readonly ICurrentUserService  _currentUserService;
    private readonly IUserRepository      _userRepository;
    private readonly IRoadSafetyRepository _roadSafetyRepository;
    private readonly IIncidentRepository  _incidentRepository;
    private readonly IRouteProvider       _routeProvider;
    private readonly ISafetyScoreService  _safetyScoreService;

    public GetSafeRouteHandler(
        ICurrentUserService   currentUserService,
        IUserRepository       userRepository,
        IRoadSafetyRepository roadSafetyRepository,
        IIncidentRepository   incidentRepository,
        IRouteProvider        routeProvider,
        ISafetyScoreService   safetyScoreService)
    {
        _currentUserService   = currentUserService;
        _userRepository       = userRepository;
        _roadSafetyRepository = roadSafetyRepository;
        _incidentRepository   = incidentRepository;
        _routeProvider        = routeProvider;
        _safetyScoreService   = safetyScoreService;
    }

    public async Task<ApiResponse<SafeRouteDto>> Handle(
        GetSafeRouteQuery request,
        CancellationToken cancellationToken)
    {
        // ── 1. Validasi user ───────────────────────────────────────────
        var userId = _currentUserService.UserId;

        if (userId == Guid.Empty)
            return ApiResponse<SafeRouteDto>.Failure("User tidak ditemukan");

        var user = await _userRepository.GetByIdAsync(
            userId.Value, cancellationToken);

        if (user is null ||
            !user.CurrentLatitude.HasValue ||
            !user.CurrentLongitude.HasValue)
        {
            return ApiResponse<SafeRouteDto>.Failure(
                "Lokasi real-time user belum tersedia. Pastikan GPS aktif.");
        }

        // ── 2. Ambil route dari OSRM 
        var route = await _routeProvider.GetSafeRouteAsync(
            user.CurrentLatitude.Value,
            user.CurrentLongitude.Value,
            request.DestinationLatitude,
            request.DestinationLongitude);

        // ── 3. Fetch data secara paralel 
        var (roadSegments, incidents) = await FetchSafetyDataAsync(
            route.RouteGeometry, cancellationToken);

        // ── 4. Hitung safety score gabungan 
        var safetyScore = _safetyScoreService.Calculate(
            roadSegments, incidents);

        // Console.WriteLine($"Route geometry: {route.GeometryJson}");

        // ── 5. Build response 
        var geometry = JsonSerializer.Deserialize<RouteGeometryDto>(
            route.GeometryJson);


        var result = new SafeRouteDto
        {
            DistanceKm         = Math.Round(route.DistanceKm, 2),
            DurationMinutes    = Math.Round(route.DurationMinutes, 2),
            AverageSafetyScore = Math.Round(safetyScore, 2),
            SafetyLevel        = GetSafetyLevel(safetyScore),
            Geometry           = geometry ?? new RouteGeometryDto(),

            // Segmen dari RoadSafetySegments (kondisi jalan)
            Segments = roadSegments.Select(x => new RouteSegmentDto
            {
                StartLatitude  = x.Geom.Coordinates.First().Y,
                StartLongitude = x.Geom.Coordinates.First().X,
                EndLatitude    = x.Geom.Coordinates.Last().Y,
                EndLongitude   = x.Geom.Coordinates.Last().X,
                SafetyScore    = ConvertSafetyScoreToDouble(x.SafetyScore)
            }).ToList(),

            // Insiden aktif di sepanjang route
            NearbyIncidents = incidents.Select(x => new NearbyIncidentDto
            {
                Id          = x.Id,
                Title       = x.LocationDescription,
                Description = x.Description,
                Latitude    = x.Geom.Coordinates.First().Y,
                Longitude   = x.Geom.Coordinates.First().X,
            }).ToList()
        };

        Console.WriteLine($"Road segments  : {roadSegments.Count}");
        Console.WriteLine($"Incidents      : {incidents.Count}");
        Console.WriteLine($"Safety score   : {safetyScore}");
        Console.WriteLine($"Origin         : ({user.CurrentLatitude}, {user.CurrentLongitude})");
        Console.WriteLine($"Destination    : ({request.DestinationLatitude}, {request.DestinationLongitude})");

        return new ApiResponse<SafeRouteDto> {
            Message = "Rute aman berhasil dihitung",
            Data = result,
            Success = true };
    }

    // ── Helper: fetch paralel 
private async Task<(
    List<RoadSafetySegments>,
    List<SiAman.Domain.Entities.Incidents>)>
FetchSafetyDataAsync(
    Geometry routeGeometry,
    CancellationToken ct)
{
    var roadSegments =
        await _roadSafetyRepository
            .GetIntersectedSegmentsAsync(routeGeometry);

    var incidents =
        await _incidentRepository
            .GetNearbyIncidentsAlongRouteAsync(
                routeGeometry,
                500);

    return (roadSegments, incidents);
}

    private static string GetSafetyLevel(double score) =>
        score switch
        {
            >= 80 => "Aman",
            >= 50 => "Waspada",
            _     => "Berbahaya"
        };

    private static double ConvertSafetyScoreToDouble(SafetyScore score) =>
        score switch
        {
            SafetyScore.Aman      => 100,
            SafetyScore.Waspada  => 60,
            SafetyScore.Berbahaya => 20,
            _                     => 100
        };
}