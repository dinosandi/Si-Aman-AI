using System;
using Microsoft.EntityFrameworkCore;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Domain.Entities;
using SiAman.Infrastructure.Persistence;

namespace SiAman.Infrastructure.Repositories
{
    public class UserLocationRepository : IUserLocationRepository
    {
        private readonly AppDbContext _context;

        public UserLocationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UserLocations?> GetLatestLocationAsync(Guid userId)
        {
            return await _context.UserLocations
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.RecordedAt)
                .FirstOrDefaultAsync();
        }


    }

}