using MediatR;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Navigation.DTOs;

namespace SiAman.Application.Features.Navigation.Queries;

public class GetSafeRouteQuery
    : IRequest<ApiResponse<SafeRouteWithAlternativesDto>>
{
    public double DestinationLatitude  { get; set; }
    public double DestinationLongitude { get; set; }

    // default 1 alternatif, frontend akan naikkan ke 2-3 jika ada insiden
    public int MaxAlternatives { get; set; } = 1;
}