using System;

namespace SiAman.Application.Common.Interfaces.Service
{
    public interface ICurrentUserService
    {
        Guid? UserId { get; }
        string? Email { get; }
        bool IsAuthenticated { get; }
        bool IsAdmin { get; }
    }

}

