using Microsoft.EntityFrameworkCore;
using SiAman.Application.Common.Exceptions;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Domain.Entities;
using SiAman.Infrastructure.Persistence;

namespace SiAman.Infrastructure.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;
        private readonly IUserRepository _userRepository;

        public UserService(AppDbContext context, IUserRepository userRepository)
        {
            _context = context;
            _userRepository = userRepository;
        }

        public async Task<Users> GetUsersAsync(string email, string name)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

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
        public async Task<Users> GetUserByEmail(string Email)
        {
            return await _context.Users
            .AsNoTracking() // Menambahkan AsNoTracking untuk meningkatkan performa saat hanya membaca data
            .FirstOrDefaultAsync(u => u.Email == Email);
        }
        public async Task<Users> GetUserByName(string Name)
        {
            return await _context.Users
            .AsNoTracking() // Menambahkan AsNoTracking untuk meningkatkan performa saat hanya membaca data
            .FirstOrDefaultAsync(u => u.Name == Name);
        }

        public async Task UpdateLoginStatusAsync(Guid userId, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct)
                ?? throw new NotFoundException("User tidak ditemukan.");

            var now = DateTimeOffset.UtcNow;
            user.IsOnline = true;
            user.LastLoginAt = now;
            user.LastActivityAt = now;
            user.UpdatedAt = now;

            await _userRepository.UpdateAsync(userId, ct);
        }


    }

}

