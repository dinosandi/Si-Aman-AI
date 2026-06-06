using MediatR;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Navigation.DTOs;

namespace SiAman.Application.Features.Navigation.Queries;

public class GetSafeRouteQuery
    : IRequest<ApiResponse<SafeRouteWithAlternativesDto>>
{
    public double DestinationLatitude  { get; set; }
    public double DestinationLongitude { get; set; }

    // ← tambah ini, default 3 alternatif
    public int MaxAlternatives { get; set; } = 3;
}