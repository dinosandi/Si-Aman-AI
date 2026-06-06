using MediatR;
using SiAman.Application.Common.Exceptions;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Common.Models;

namespace SiAman.Application.Features.Auth.Commands.LoginManualWithEmail;

public class LoginManualHandler
    : IRequestHandler<LoginManualCommand, ApiResponse<AuthResponse>>
{
    private readonly IUserService _userService;
    private readonly IAuthenticationService _authenticationService;
    private readonly IJwtService _jwtService;
    private readonly IRefreshTokenService _refreshTokenService;
    private readonly ICookieService _cookieService;

    public LoginManualHandler(
        IUserService userService,
        IAuthenticationService authenticationService,
        IJwtService jwtService,
        IRefreshTokenService refreshTokenService,
        ICookieService cookieService)
    {
        _userService = userService;
        _authenticationService = authenticationService;
        _jwtService = jwtService;
        _refreshTokenService = refreshTokenService;
        _cookieService = cookieService;
    }

    public async Task<ApiResponse<AuthResponse>> Handle(
        LoginManualCommand request,
        CancellationToken cancellationToken)
    {
        var user = await _userService.GetUserByEmail(request.Email);

        if (user is null)
            throw new NotFoundException("User tidak ditemukan.");

        if (!_authenticationService.VerifyPassword(
                request.Password,
                user.Password))
        {
            throw new UnauthorizedAccessException(
                "Email atau password salah.");
        }

        // Access Token
        var accessToken = _jwtService.GenerateToken(user);

        // Refresh Token
        var refreshToken = await _refreshTokenService.CreateAsync(
            user.Id,
            deviceInfo: "Web Browser",
            ipAddress: null,
            ct: cancellationToken);

        // Simpan ke HttpOnly Cookie
        _cookieService.SetAccessToken(accessToken);
        _cookieService.SetRefreshToken(refreshToken.TokenRaw);

         await _userService.UpdateLoginStatusAsync(user.Id, cancellationToken);
        return ApiResponse<AuthResponse>.SuccessResponse(
            new AuthResponse
            {
                UserId = user.Id,
                Name = user.Name ?? string.Empty,
                Email = user.Email,
                Role = user.Role.ToString(),
                IsProfileCompleted = user.IsProfileCompleted
            },
            "Login berhasil."
        );
    }
}