using Microsoft.AspNetCore.Http;
using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Incidents.DTOs
{
    public class CreateIncidentDto
    {
        public TypeIncidents Type { get; set; }
        public string? Other { get; set; }         
        public string Description { get; set; } = string.Empty;
        public string? LocationDescription { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public IFormFile Image { get; set; } = default!;
    }

}

