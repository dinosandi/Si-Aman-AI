using SiAman.Domain.Enums;
using MediatR;
using SiAman.Application.Features.Incidents.DTOs;
using SiAman.Application.Common.Models;
using Microsoft.AspNetCore.Http;


namespace SiAman.Application.Features.Incidents.Commands.CreateIncident
{

    public class CreateIncidentCommand : IRequest<ApiResponse<IncidentResponseDto>>
    {
        public Guid UserId { get; set; }
        public TypeIncidents Type { get; set; } = default!;
        public string? Other { get; set; }
        public IFormFile Image { get; set; } = default!;
        public string Description { get; set; } = default!;
        public string? LocationDescription { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public StatusIncidents Status { get; set; } = default!;
        public DateTimeOffset ReportedAt { get; set; }

    }


}
