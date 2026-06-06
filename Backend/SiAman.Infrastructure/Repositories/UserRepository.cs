using SiAman.Domain.Entities;
using SiAman.Application.Common.Interfaces.Repository;
using Microsoft.EntityFrameworkCore;
using SiAman.Infrastructure.Persistence;
using SiAman.Application.Common.Exceptions;


namespace SiAman.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _context;
        public UserRepository(AppDbContext context)
        {
            _context = context;
        }

        // 
         public async Task<UserLocations?> GetLatestLocationAsync(Guid userId)
    {
        return await _context.UserLocations
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.RecordedAt)
            .FirstOrDefaultAsync();
    }

       public async Task<Users?> GetByIdAsync(
           Guid id,
           CancellationToken cancellationToken)
           => await _context.Users
               .AsNoTracking()      // read-only, tidak perlu tracking
               .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

        public async Task<Users> GetUserByEmail(string Email)
        {
            return await _context.Users
            .AsNoTracking() // Menambahkan AsNoTracking untuk meningkatkan performa saat hanya membaca data
            .FirstOrDefaultAsync(u => u.Email == Email);
        }
        public async Task AddUserAsync(Users user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        public async Task<Users> GetUsersAsync(string email, string name)
        {
            var user = await _context.Users
            .AsNoTracking() // Menambahkan AsNoTracking untuk meningkatkan performa saat hanya membaca data
            .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                user = new Users
                {
                    Email = email,
                    Name = name,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            return user;
        }

        public async Task<Users> UpdateAsync(Guid userId, CancellationToken ct = default)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, ct)
                ?? throw new NotFoundException("User tidak ditemukan.");

            var now = DateTimeOffset.UtcNow;
            user.IsOnline = true;
            user.LastLoginAt = now;
            user.LastActivityAt = now;
            user.UpdatedAt = now;

            _context.Users.Update(user);
            await _context.SaveChangesAsync(ct);

            return user;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }

}

