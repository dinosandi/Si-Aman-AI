using System;
using NetTopologySuite.Geometries;
using SiAman.Domain.Enums;

namespace SiAman.Domain.Entities
{
    public class RoadSafetySegments
    {
        public Guid Id { get; set; }
        public long OsmdId { get; set; }
        public string Latitude { get; set; } = default!;
        public string Longitude { get; set; } = default!;
        public LineString Geom { get; set; } = default!;

        public DateTimeOffset CalculatedAt { get; set; }
        public SafetyScore SafetyScore { get; set; }

    }
}

