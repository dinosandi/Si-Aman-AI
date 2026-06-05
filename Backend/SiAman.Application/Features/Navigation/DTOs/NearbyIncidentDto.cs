using System;

namespace SiAman.Application.Features.Navigation.DTOs
{

    public class NearbyIncidentDto
    {
        public Guid   Id          { get; set; }
        public string Title       { get; set; } = default!;
        public string Description { get; set; } = default!;
        public double Latitude    { get; set; }
        public double Longitude   { get; set; }

    }

}

