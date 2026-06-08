using MediatR;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Incidents.DTOs;


namespace SiAman.Application.Features.Incidents.Queries
{
    public record GetAllIncidentsQuery : IRequest<ApiResponse<List<IncidentResponseDto>>>;
    
}

