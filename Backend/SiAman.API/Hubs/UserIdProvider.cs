// SiAman.API/Hubs/UserIdProvider.cs
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace SiAman.API.Hubs
{
    public class UserIdProvider : IUserIdProvider
    {
        public string? GetUserId(HubConnectionContext connection)
        {
            // Ambil UserId dari JWT claim "sub" atau NameIdentifier
            return connection.User?
                .FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? connection.User?
                .FindFirst("sub")?.Value;
        }
    }
}