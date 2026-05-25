// SiAman.Domain/Entities/RefreshTokens.cs
namespace SiAman.Domain.Entities
{
    public class RefreshTokens
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid UserId { get; set; }
        public string TokenHash { get; set; } = default!;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RevokedAt { get; set; }

        public string? DeviceInfo { get; set; }   // "Chrome / Windows 11"
        public string? CreatedByIp { get; set; }
        public string? RevokedByIp { get; set; }
        public bool IsActive  => RevokedAt == null && DateTime.UtcNow < ExpiresAt;
        public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
        public bool IsRevoked => RevokedAt != null;
        public Users User { get; set; } = null!;  // Relasi ke Users
    }
}