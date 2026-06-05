using System;

namespace SiAman.Domain.Entities
{
    public class EmergencyContacts
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public Users User { get; set; } = default!;

        public string ContactName { get; set; } = default!;
        public string ContactPhone { get; set; } = default!;
        public string? Relationship { get; set; }  // "Ibu", "Ayah", "Teman"
        public bool IsPrimary { get; set; } = false;

        public DateTime CreatedAt { get; set; }
    }

}

