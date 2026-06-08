using MediatR;
using SiAman.Application.Common.Models;

namespace SiAman.Application.Features.Auth.Commands.RefreshToken
{
    public record RefreshTokenCommand : IRequest<ApiResponse<AuthResponse>>{}
}