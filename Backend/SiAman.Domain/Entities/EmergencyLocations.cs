using System;

namespace SiAman.Domain.Entities
{
    public class EmergencyLocations
    {
        public Guid Id { get; set; }
        public Guid AlertId { get; set; }
        public EmergencyAlerts Alert { get; set; } = default!;
        public double Latitude { get; set; } = default!;
        public double Longitude { get; set; } = default!;
        public DateTimeOffset RecordedAt { get; set; }

    }

}
