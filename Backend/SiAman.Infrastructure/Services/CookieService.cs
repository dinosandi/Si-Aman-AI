// SiAman.Infrastructure/Services/CookieService.cs
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using SiAman.Application.Common.Interfaces.Service;

namespace SiAman.Infrastructure.Services
{
    public class CookieService : ICookieService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IConfiguration _config;

        private const string AccessTokenKey  = "access_token";
        private const string RefreshTokenKey = "refresh_token";

        public CookieService(
            IHttpContextAccessor httpContextAccessor,
            IConfiguration config)
        {
            _httpContextAccessor = httpContextAccessor;
            _config              = config;
        }

        // Akses HttpContext — throw jika tidak tersedia (misal: background job)
        private HttpContext HttpContext =>
            _httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException(
                "CookieService tidak bisa digunakan di luar HTTP request context.");

        public void SetAccessToken(string token)
        {
            var expiryMinutes = int.Parse(
                _config["Jwt:ExpiryMinutes"] ?? "15");

            HttpContext.Response.Cookies.Append(
                AccessTokenKey,
                token,
                BuildCookieOptions(DateTimeOffset.UtcNow.AddMinutes(expiryMinutes)));
        }

        public void SetRefreshToken(string token)
        {
            var expiryDays = int.Parse(
                _config["Jwt:RefreshExpireDays"] ?? "30");

            // Path dibatasi ke /api/auth/refresh —
            // browser hanya kirim cookie ini ke endpoint refresh, tidak ke semua request
            HttpContext.Response.Cookies.Append(
                RefreshTokenKey,
                token,
                BuildCookieOptions(
                    DateTimeOffset.UtcNow.AddDays(expiryDays),
                    path: "/api/auth/refresh"));
        }

        public string? GetAccessToken()
            => HttpContext.Request.Cookies[AccessTokenKey];

        public string? GetRefreshToken()
            => HttpContext.Request.Cookies[RefreshTokenKey];

        public void ClearAuthCookies()
        {
            // Set expired di masa lalu — browser langsung hapus cookie
            var expired = BuildCookieOptions(DateTimeOffset.UtcNow.AddDays(-1));
            var expiredRefresh = BuildCookieOptions(
                DateTimeOffset.UtcNow.AddDays(-1),
                path: "/api/auth/refresh");

            HttpContext.Response.Cookies.Append(AccessTokenKey,  "", expired);
            HttpContext.Response.Cookies.Append(RefreshTokenKey, "", expiredRefresh);
        }

        // ── Private helper

        private static CookieOptions BuildCookieOptions(
            DateTimeOffset expires,
            string path = "/")
        {
            return new CookieOptions
            {
                HttpOnly = true,                   // tidak bisa diakses JS → proteksi XSS
                Secure   = false,                   // hanya HTTPS (set false untuk local HTTP dev)
                SameSite = SameSiteMode.Strict,    // proteksi CSRF
                Expires  = expires,
                Path     = path
            };
        }
    }
}