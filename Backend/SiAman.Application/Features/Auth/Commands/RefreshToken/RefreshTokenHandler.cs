using MediatR;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Common.Models;

namespace SiAman.Application.Features.Auth.Commands.RefreshToken
{
    public class RefreshTokenHandler
        : IRequestHandler<RefreshTokenCommand, ApiResponse<AuthResponse>>
    {
        private readonly IRefreshTokenService _refreshTokenService;
        private readonly IJwtService _jwtService;
        private readonly ICookieService _cookieService;

        public RefreshTokenHandler(
            IRefreshTokenService refreshTokenService,
            IJwtService jwtService,
            ICookieService cookieService)
        {
            _refreshTokenService = refreshTokenService;
            _jwtService          = jwtService;
            _cookieService       = cookieService;
        }

        public async Task<ApiResponse<AuthResponse>> Handle(
            RefreshTokenCommand request,
            CancellationToken cancellationToken)
        {
            // 1. Baca raw token dari HttpOnly cookie
            var rawToken = _cookieService.GetRefreshToken();

            if (string.IsNullOrEmpty(rawToken))
                throw new UnauthorizedAccessException(
                    "Refresh token tidak ditemukan. Silakan login kembali.");

            // 2. Validasi hash + expiry + revoke status di DB
            var tokenEntity = await _refreshTokenService.ValidateAsync(
                rawToken, cancellationToken);

            if (tokenEntity is null)
                throw new UnauthorizedAccessException(
                    "Refresh token tidak valid atau sudah kadaluarsa. Silakan login kembali.");

            // 3. Ambil user dari navigation property (sudah di-Include di ValidateAsync)
            var user = tokenEntity.User
                ?? throw new UnauthorizedAccessException("Data user tidak ditemukan.");

            // 4. Token Rotation: revoke lama → buat baru
            await _refreshTokenService.RevokeAsync(
                tokenId:   tokenEntity.Id,
                ipAddress: null,
                ct:        cancellationToken);

            var newRefreshToken = await _refreshTokenService.CreateAsync(
                userId:     user.Id,
                deviceInfo: tokenEntity.DeviceInfo,    
                ipAddress:  tokenEntity.CreatedByIp,
                ct:         cancellationToken);

            var newAccessToken = _jwtService.GenerateToken(user);

            // 5. Update cookies 
            _cookieService.SetAccessToken(newAccessToken);
            _cookieService.SetRefreshToken(newRefreshToken.TokenRaw);

            return ApiResponse<AuthResponse>.SuccessResponse(
                new AuthResponse
                {
                    UserId             = user.Id,
                    Name               = user.Name ?? string.Empty,
                    Email              = user.Email,
                    Role               = user.Role.ToString(),
                    IsProfileCompleted = user.IsProfileCompleted,
                    AccessToken        = newAccessToken
                },
                "Token berhasil diperbarui."
            );
        }
    }
}