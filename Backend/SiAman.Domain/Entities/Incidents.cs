using NetTopologySuite.Geometries;
using SiAman.Domain.Enums;
using System;

namespace SiAman.Domain.Entities
{
    public class Incidents
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Users User { get; set; } = default!;

        public TypeIncidents Type { get; set; } = default!;
        public string? Other { get; set; }
        public string ImageUrl { get; set; } = default!;
        public string Description { get; set; } = default!;
        public string? LocationDescription { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public StatusIncidents Status { get; set; } = default!; 
        public Geometry Geom { get; set; } = default!; // Kolom Geometry untuk penyimpanan spasial (SRID 4326)

        public DateTimeOffset ReportedAt { get; set; }
        public DateTimeOffset? ResolvedAt { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

