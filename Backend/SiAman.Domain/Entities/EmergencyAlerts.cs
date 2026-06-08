using SiAman.Domain.Enums;

namespace SiAman.Domain.Entities
{

    public class EmergencyAlerts
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Users User { get; set; } = default!;
        public StatusAlerts Status { get; set; }
        public DateTimeOffset TriggeredAt { get; set; }
        public DateTimeOffset? ReslolvedAt { get; set; }

        public ICollection<EmergencyLocations> Locations { get; set; } = new List<EmergencyLocations>();

    }

}
