using MediatR;
using SiAman.Application.Common.Models;

namespace SiAman.Application.Features.Auth.Commands.LoginWithGoogle
{
    public record LoginWithGoogle(string IdToken) : IRequest<ApiResponse<AuthResponse>>;
}