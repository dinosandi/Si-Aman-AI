// SiAman.Infrastructure/Services/CompositeRouteProvider.cs
using Microsoft.Extensions.Configuration;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Features.Navigation.DTOs;
using SiAman.Domain.Enums;

namespace SiAman.Infrastructure.Services;

public class CompositeRouteProvider : IRouteProvider
{
    private readonly OsrmRouteProvider     _osrmProvider;
    private readonly DatabaseRouteProvider _databaseProvider;
    private readonly RouteProviderSource   _activeSource;

    public CompositeRouteProvider(
        OsrmRouteProvider     osrmProvider,
        DatabaseRouteProvider databaseProvider,
        IConfiguration        configuration)
    {
        _osrmProvider     = osrmProvider;
        _databaseProvider = databaseProvider;

        var sourceStr = configuration["RouteProvider:Source"] ?? "Osrm";
        _activeSource = Enum.Parse<RouteProviderSource>(sourceStr, ignoreCase: true);

        Console.WriteLine($"[CompositeRoute] Active source: {_activeSource}");
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
            ?? throw new InvalidOperationException("Tidak ada rute ditemukan.");
    }

    public async Task<List<RouteResult>> GetAlternativeRoutesAsync(
        double originLat, double originLng,
        double destinationLat, double destinationLng,
        int maxAlternatives = 3)
    {
        return _activeSource switch
        {
            RouteProviderSource.Database    => await GetFromDatabaseWithFallback(
                                                    originLat, originLng,
                                                    destinationLat, destinationLng,
                                                    maxAlternatives),

            RouteProviderSource.Osrm        => await GetFromOsrm(
                                                    originLat, originLng,
                                                    destinationLat, destinationLng,
                                                    maxAlternatives),

            RouteProviderSource.GraphHopper => throw new NotImplementedException(
                                                    "GraphHopper belum diimplementasi"),
            _                              => await GetFromOsrm(
                                                    originLat, originLng,
                                                    destinationLat, destinationLng,
                                                    maxAlternatives)
        };
    }

    // ── Database dulu, kalau kosong fallback ke OSRM
    private async Task<List<RouteResult>> GetFromDatabaseWithFallback(
        double originLat, double originLng,
        double destinationLat, double destinationLng,
        int maxAlternatives)
    {
        try
        {
            var dbRoutes = await _databaseProvider.GetAlternativeRoutesAsync(
                originLat, originLng,
                destinationLat, destinationLng,
                maxAlternatives);

            if (dbRoutes.Count > 0)
            {
                Console.WriteLine($"[CompositeRoute] Menggunakan Database ({dbRoutes.Count} rute)");
                return dbRoutes;
            }

            Console.WriteLine("[CompositeRoute] Database kosong untuk area ini, fallback ke OSRM");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CompositeRoute] Database error, fallback ke OSRM. Reason: {ex.Message}");
        }

        return await GetFromOsrm(originLat, originLng, destinationLat, destinationLng, maxAlternatives);
    }

    // ── OSRM murni
    private async Task<List<RouteResult>> GetFromOsrm(
        double originLat, double originLng,
        double destinationLat, double destinationLng,
        int maxAlternatives)
    {
        Console.WriteLine("[CompositeRoute] Menggunakan OSRM");
        return await _osrmProvider.GetAlternativeRoutesAsync(
            originLat, originLng,
            destinationLat, destinationLng,
            maxAlternatives);
    }
}