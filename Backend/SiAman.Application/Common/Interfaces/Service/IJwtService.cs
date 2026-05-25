
using SiAman.Domain.Entities;

namespace SiAman.Application.Common.Interfaces.Service
{
    public interface IJwtService
    {
        string GenerateToken(Users user);
        

        // baca userid dari token yang sudah expired, untuk keperluan refresh token
        Guid? GetUserIdFromExpiredToken(string token);

    }
}
