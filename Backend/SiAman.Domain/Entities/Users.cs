using NetTopologySuite.Geometries; 
using SiAman.Domain.Enums;

namespace SiAman.Domain.Entities
{
    public class Users
    {
        public Guid Id { get; set; }

        // Authentication
        public string Email { get; set; } = default!;
        public string? Password { get; set; }
        public AuthProvider Provider { get; set; }
        public string? ProviderId { get; set; }

        // Profile
        public string? Name { get; set; }
        public string? Address { get; set; }
        public string? AvatarUrl { get; set; }

        // Contact
        public string? PhoneNumber { get; set; }

        // Role & Status
        public Role Role { get; set; }
        public bool IsProfileCompleted { get; set; }
        public bool IsOnline { get; set; }
        public bool IsEmailVerified { get; set; }

        public DateTimeOffset? LastLoginAt { get; set; }
        public DateTimeOffset? LastActivityAt { get; set; }

        // Current GPS — cache lokasi terakhir (NTS Point, bukan Drawing.Point)
        public Point? CurrentLocation { get; set; }      // ← NetTopologySuite.Geometries.Point
        public double? CurrentLatitude { get; set; }     // raw value untuk kemudahan serialisasi
        public double? CurrentLongitude { get; set; }
        public DateTimeOffset? LastLocationUpdatedAt { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public ICollection<UserLocations?> Locations { get; set; } = new List<UserLocations>();
        public ICollection<RefreshTokens> RefreshTokens { get; set; } = new List<RefreshTokens>();
        public ICollection<EmergencyContacts> EmergencyContacts { get; set; } = new List<EmergencyContacts>();
    }
}