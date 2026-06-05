using System;
using NetTopologySuite.Geometries;

namespace SiAman.Domain.Entities
{
    public class SafeRoutes
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Users User { get; set; }
        public double OriginLatitude { get; set; }
        public double OriginLongitude { get; set; }
        public double DestinationLatitude { get; set; }
        public double DestinationLongitude { get; set; }
        public Geometry RouteGeom { get; set; }
        public float AvarageSafetyScore { get; set; }
        public DateTime CreatedAt { get; set; }

    }
}

