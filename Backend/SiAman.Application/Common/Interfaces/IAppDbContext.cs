using SiAman.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace SiAman.Application.Common.Interfaces
{
    public interface IAppDbContext
    {
        DbSet<Users> Users { get; }
        DbSet<RefreshTokens> RefreshTokens { get; }
        DbSet<UserLocations> UserLocations { get; }
        DbSet<EmergencyContacts> EmergencyContacts { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken);
    }
}