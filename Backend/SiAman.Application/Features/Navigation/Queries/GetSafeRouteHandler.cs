using MediatR;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Navigation.DTOs;

namespace SiAman.Application.Features.Navigation.Queries;

public class GetSafeRouteHandler
    : IRequestHandler<GetSafeRouteQuery, ApiResponse<SafeRouteDto>>
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IUserLocationRepository _userLocationRepository;
    private readonly IRoadSafetyRepository _roadSafetyRepository;
    private readonly IRouteProvider _routeProvider;
    private readonly ISafetyScoreService _safetyScoreService;

    public GetSafeRouteHandler(
        ICurrentUserService currentUserService,
        IUserLocationRepository userLocationRepository,
        IRoadSafetyRepository roadSafetyRepository,
        IRouteProvider routeProvider,
        ISafetyScoreService safetyScoreService)
    {
        _currentUserService = currentUserService;
        _userLocationRepository = userLocationRepository;
        _roadSafetyRepository = roadSafetyRepository;
        _routeProvider = routeProvider;
        _safetyScoreService = safetyScoreService;
    }

    public async Task<ApiResponse<SafeRouteDto>> Handle(
        GetSafeRouteQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;

        if (userId == Guid.Empty)
        {
            return ApiResponse<SafeRouteDto>.Failure(
                "User tidak ditemukan");
        }

        var currentLocation =
            await _userLocationRepository
                .GetLatestLocationAsync(userId.Value);

        if (currentLocation is null)
        {
            return ApiResponse<SafeRouteDto>.Failure(
                "Lokasi user belum tersedia");
        }

        var route =
            await _routeProvider.GetSafeRouteAsync(
                currentLocation.Latitude!.Value,
                currentLocation.Longitude!.Value,
                request.DestinationLatitude,
                request.DestinationLongitude);

        var segments =
            await _roadSafetyRepository
                .GetIntersectedSegmentsAsync(
                    route.RouteGeometry);

        var safetyScore =
            _safetyScoreService.Calculate(segments);

        var result = new SafeRouteDto
        {
            DistanceKm = route.DistanceKm,
            DurationMinutes = route.DurationMinutes,
            Geometry = route.GeometryJson,
            AverageSafetyScore = safetyScore,
            SafetyLevel = GetSafetyLevel(safetyScore)
        };

        return new ApiResponse<SafeRouteDto> { Data = result, Success = true };
    }

    private static string GetSafetyLevel(double score)
    {
        if (score >= 80)
            return "Aman";

        if (score >= 50)
            return "Waspada";

        return "Berbahaya";
    }
}