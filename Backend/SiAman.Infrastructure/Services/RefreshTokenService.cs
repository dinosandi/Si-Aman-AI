// SiAman.Infrastructure/Services/RefreshTokenService.cs
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SiAman.Application.Common.Interfaces;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Common.Models;
using SiAman.Domain.Entities;
using System.Security.Cryptography;
using System.Text;

namespace SiAman.Infrastructure.Services
{
    public class RefreshTokenService : IRefreshTokenService
    {
        // Inject IAppDbContext bukan AppDbContext langsung — Dependency Inversion
        private readonly IAppDbContext _context;
        private readonly IConfiguration _config;

        public RefreshTokenService(IAppDbContext context, IConfiguration config)
        {
            _context = context;
            _config  = config;
        }

        public async Task<RefreshTokenResult> CreateAsync(
            Guid userId,
            string? deviceInfo  = null,
            string? ipAddress   = null,
            CancellationToken ct = default)
        {
            var expireDays = int.Parse(_config["Jwt:RefreshExpireDays"] ?? "30");

            // 1. Generate raw token — hanya ada di memory sebentar
            var rawToken  = GenerateSecureRawToken();

            // 2. Hash sebelum simpan ke DB
            var tokenHash = HashToken(rawToken);

            var entity = new RefreshTokens
            {
                Id          = Guid.NewGuid(),
                UserId      = userId,
                TokenHash   = tokenHash,          // ← hash, bukan raw
                ExpiresAt   = DateTime.UtcNow.AddDays(expireDays),
                DeviceInfo  = deviceInfo,
                CreatedByIp = ipAddress,
                CreatedAt   = DateTime.UtcNow
            };

            _context.RefreshTokens.Add(entity);
            await _context.SaveChangesAsync(ct);

            // 3. Return raw token untuk dikirim ke cookie — tidak tersimpan di DB
            return new RefreshTokenResult
            {
                TokenRaw = rawToken,
                Entity   = entity
            };
        }

        public async Task<RefreshTokens?> ValidateAsync(
            string rawToken,
            CancellationToken ct = default)
        {
            var tokenHash = HashToken(rawToken);

            // Query pakai kolom DB langsung — bukan computed property IsActive
            // Computed property tidak bisa ditranslate EF ke SQL
            return await _context.RefreshTokens
                .Include(t => t.User)             // ← Include agar User tidak null
                .FirstOrDefaultAsync(t =>
                    t.TokenHash  == tokenHash &&
                    t.RevokedAt  == null    &&     // belum di-revoke
                    t.ExpiresAt  > DateTime.UtcNow, // belum expired
                    ct);
        }

        public async Task RevokeAsync(
            Guid tokenId,
            string? ipAddress   = null,
            CancellationToken ct = default)
        {
            // ExecuteUpdateAsync = satu UPDATE query, tanpa load entity ke memory
            var affected = await _context.RefreshTokens
                .Where(t => t.Id == tokenId && t.RevokedAt == null)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(t => t.RevokedAt,   DateTime.UtcNow)
                    .SetProperty(t => t.RevokedByIp, ipAddress),
                    ct);

            // Jika 0 baris teraffect → token sudah di-revoke atau tidak ada
            // Tidak perlu throw — silent revoke lebih aman (tidak bocorkan info)
        }

        public async Task RevokeAllUserTokensAsync(
            Guid userId,
            string? ipAddress   = null,
            CancellationToken ct = default)
        {
            // Satu query bulk UPDATE — tidak perlu load semua entity ke memory
            await _context.RefreshTokens
                .Where(t => t.UserId    == userId &&
                            t.RevokedAt == null)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(t => t.RevokedAt,   DateTime.UtcNow)
                    .SetProperty(t => t.RevokedByIp, ipAddress),
                    ct);
        }

        // ── Private helpers ──────────────────────────────────────────────

        private static string GenerateSecureRawToken()
        {
            // 64 byte = 512 bit — lebih dari cukup untuk token
            // RandomNumberGenerator adalah CSPRNG — aman secara kriptografis
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        }

        private static string HashToken(string rawToken)
        {
            // SHA-256 cukup untuk token random (tidak perlu bcrypt/Argon2
            // karena token sudah high-entropy — bukan password user)
            var bytes = Encoding.UTF8.GetBytes(rawToken);
            var hash  = SHA256.HashData(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}