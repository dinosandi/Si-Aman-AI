using System;

namespace SiAman.Domain.Entities
{
    public class EmergencyLocations
    {
        public Guid Id { get; set; }
        public Guid AlertId { get; set; }
        public EmergencyAlerts Alert { get; set; } = default!;
        public string Latitude { get; set; } = default!;
        public string Longitude { get; set; } = default!;
        public DateTimeOffset RecordedAt { get; set; }

    }

}
