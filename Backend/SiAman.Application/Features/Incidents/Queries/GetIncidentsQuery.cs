using SiAman.Application.Common.Models;
using MediatR;
using SiAman.Application.Features.Incidents.DTOs;


namespace SiAman.Application.Features.Incidents.Queries
{
    public class GetIncidentsQuery : IRequest<ApiResponse<List<IncidentResponseDto>>>
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double RadiusMeters { get; set; } = 1000; // Radius default 1 km
    }

}
