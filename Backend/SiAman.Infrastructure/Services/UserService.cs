using Microsoft.EntityFrameworkCore;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Domain.Entities;
using SiAman.Infrastructure.Persistence;

namespace SiAman.Infrastructure.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;

        public UserService(AppDbContext context)
        {
            _context = context;
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
    }
    
}

