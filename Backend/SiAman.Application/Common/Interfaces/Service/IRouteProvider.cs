using SiAman.Application.Features.Navigation.DTOs;

namespace SiAman.Application.Common.Interfaces.Service;

public interface IRouteProvider
{
    Task<RouteResult> GetSafeRouteAsync(
        double originLat,
        double originLng,
        double destinationLat,
        double destinationLng);
    Task<List<RouteResult>> GetAlternativeRoutesAsync(
        double originLat,
        double originLng,
        double destinationLat,
        double destinationLng,
        int    maxAlternatives = 3);
}