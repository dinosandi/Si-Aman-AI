using System;
using SiAman.Application.Common.Models;
using MediatR;


namespace SiAman.Application.Features.Auth.Commands.LoginManualWithEmail
{
    public class LoginManualCommand : IRequest<ApiResponse<AuthResponse>>
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

}
 