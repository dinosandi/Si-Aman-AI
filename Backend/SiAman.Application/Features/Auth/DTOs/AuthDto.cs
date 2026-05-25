namespace SiAman.Application.Features.Auth.DTOs
{
    // Response setelah login/register berhasil
    public class AuthResponse
    {
        public string Name { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string Role { get; set; } = default!;
        public bool IsProfileCompleted { get; set; }
        public string AccessToken { get; set; } = default!;
        // RefreshToken TIDAK dikirim di body — hanya via HttpOnly Cookie
    }

    // Response untuk GetCurrentUser
    public class CurrentUserResponse
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
        public string Email { get; set; } = default!;
        public string? AvatarUrl { get; set; }
        public string? PhoneNumber { get; set; }
        public bool IsProfileCompleted { get; set; }
        public bool IsEmailVerified { get; set; }
        public DateTimeOffset? LastLoginAt { get; set; }
    }
}