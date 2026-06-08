using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SiAman.Application.Common.Interfaces.Service;

namespace SiAman.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User
        => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var value = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                     ?? User?.FindFirst("sub")?.Value;

            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public string? Email
        => User?.FindFirst(ClaimTypes.Email)?.Value
        ?? User?.FindFirst("email")?.Value;

    public bool IsAuthenticated
        => User?.Identity?.IsAuthenticated ?? false;

    public bool IsAdmin
        => User?.FindFirst(ClaimTypes.Role)?.Value == "Admin";
}