using Microsoft.EntityFrameworkCore;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Domain.Entities;
using SiAman.Domain.Enums;
using SiAman.Infrastructure.Persistence;

namespace SiAman.Infrastructure.Repositories
{
    public class EmergencyRepository : IEmergencyRepository
    {
        private readonly AppDbContext _context;

        public EmergencyRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<EmergencyAlerts?> GetActiveByUserAsync(Guid userId, CancellationToken ct)
        {
            return await _context.EmergencyAlerts
                .FirstOrDefaultAsync(
                    x => x.UserId == userId && x.Status == StatusAlerts.Aktif, ct);
        }

        public async Task<EmergencyAlerts?> GetByIdAsync(Guid alertId, CancellationToken ct)
        {
            return await _context.EmergencyAlerts
                .Include(x => x.Locations)
                .FirstOrDefaultAsync(x => x.Id == alertId, ct);
        }

        public async Task<List<EmergencyAlerts>> GetAllActiveWithUserAsync(CancellationToken ct)
        {
            return await _context.EmergencyAlerts
                .Where(x => x.Status == StatusAlerts.Aktif)
                .Include(x => x.User)
                    .ThenInclude(u => u.EmergencyContacts)
                .Include(x => x.Locations)
                .OrderByDescending(x => x.TriggeredAt)
                .ToListAsync(ct);
        }

        public async Task AddAsync(EmergencyAlerts alert, CancellationToken ct)
        {
            await _context.EmergencyAlerts.AddAsync(alert, ct);
            await _context.SaveChangesAsync(ct);
        }

        public async Task UpdateAsync(EmergencyAlerts alert, CancellationToken ct)
        {
            _context.EmergencyAlerts.Update(alert);
            await _context.SaveChangesAsync(ct);
        }

        public async Task AddLocationAsync(EmergencyLocations loc, CancellationToken ct)
        {
            await _context.EmergencyLocations.AddAsync(loc, ct);
            await _context.SaveChangesAsync(ct);
        }
    }
}