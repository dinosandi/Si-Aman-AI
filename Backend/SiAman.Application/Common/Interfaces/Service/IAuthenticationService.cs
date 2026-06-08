using System;
using SiAman.Domain.Entities;


namespace SiAman.Application.Common.Interfaces.Service
{
    public interface IAuthenticationService
    {
        bool VerifyPassword(string password, string passwordHash);
        string GenerateToken(Users users);
    }
}

