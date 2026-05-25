// SiAman.Application/Common/Models/AuthResponse.cs
namespace SiAman.Application.Common.Models
{
    public class AuthResponse
    {
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsProfileCompleted { get; set; }
        public string AccessToken { get; set; } = string.Empty;
    }
}