using SiAman.Domain.Entities;
using SiAman.Application.Common.Models;
namespace SiAman.Application.Common.Interfaces.Service
{
    public interface IRefreshTokenService
    {
        Task<RefreshTokenResult> CreateAsync(
            Guid userId,
            string? deviceInfo  = null,
            string? ipAddress   = null,
            CancellationToken ct = default);

        Task<RefreshTokens?> ValidateAsync(
            string rawToken,
            CancellationToken ct = default);

        Task RevokeAsync(
            Guid tokenId,
            string? ipAddress   = null,
            CancellationToken ct = default);

        Task RevokeAllUserTokensAsync(
            Guid userId,
            string? ipAddress   = null,
            CancellationToken ct = default);
    }
}

