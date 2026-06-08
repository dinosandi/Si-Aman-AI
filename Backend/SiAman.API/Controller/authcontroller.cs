using MediatR;
using Microsoft.AspNetCore.Mvc;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Auth.Commands.LoginManualWithEmail;
using SiAman.Application.Features.Auth.Commands.LoginWithGoogle;
using SiAman.Application.Features.Auth.Commands.Register;
using SiAman.Application.Features.Auth.Commands.RefreshToken;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using SiAman.Application.Features.Auth.Queries.GetCurrentUser;

namespace SiAman.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Login(
        [FromBody] LoginManualCommand command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("login/google")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LoginWithGoogle(
        [FromBody] LoginWithGoogle command,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken(
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new RefreshTokenCommand(), cancellationToken);
        return Ok(result);
    }

    // get me
    [HttpGet("me")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)] // ← eksplisit
    public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken)
           => Ok(await _mediator.Send(new GetCurrentUserQuery(), cancellationToken));

    // logout
        [HttpPost("logout")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)] // ← eksplisit
        public IActionResult Logout()
        {
            // Hapus cookie di client
            Response.Cookies.Delete("refreshToken");
            Response.Cookies.Delete("accessToken");
    
            return Ok(ApiResponse<string>.SuccessResponse(
                null, "Logout berhasil."));
        }

}