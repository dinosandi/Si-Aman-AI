using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Domain.Entities;
using SiAman.Domain.Enums;
using SiAman.Infrastructure.Persistence;


namespace SiAman.Infrastructure.Repositories
{

    public class IncidentRepository : IIncidentRepository
    {
        private readonly AppDbContext _context;

        public IncidentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Incidents> CreateIncidentAsync(Incidents incident, CancellationToken ct = default)
        {
            _context.Incidents.Add(incident);
            await _context.SaveChangesAsync(ct);
            return incident;
        }

        public async Task<List<Incidents>> GetNearbyAsync(
            double lat, double lon, double radiusMeters,
            CancellationToken ct = default)
        {
            var factory = NetTopologySuite.NtsGeometryServices
                .Instance.CreateGeometryFactory(srid: 4326);

            // X = Longitude, Y = Latitude (konvensi NTS/PostGIS)
            var center = factory.CreatePoint(new Coordinate(lon, lat));

            return await _context.Incidents
                .Include(i => i.Votes)
                .Where(i => i.Geom.IsWithinDistance(center, radiusMeters))
                .OrderByDescending(i => i.ReportedAt)
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public async Task<Incidents?> GetByIdAsync(Guid id, CancellationToken ct = default)
        {
            return await _context.Incidents
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == id, ct);
        }

        public async Task<Incidents?> GetByIdTrackedAsync(Guid id, CancellationToken ct = default)
        {
            return await _context.Incidents
                .FirstOrDefaultAsync(i => i.Id == id, ct);
        }

        public async Task DeleteIncidentAsync(Incidents incident, CancellationToken ct = default)
        {
            _context.Incidents.Remove(incident);
            await _context.SaveChangesAsync(ct);
        }

        public async Task<List<Incidents>> GetAllIncidentsAsync(CancellationToken ct = default)
        {
            return await _context.Incidents
                .Include(i => i.Votes)
                .AsNoTracking()
                .OrderByDescending(i => i.ReportedAt)
                .ToListAsync(ct);
        }

        public async Task<List<Incidents>> GetNearbyIncidentsAlongRouteAsync(
            Geometry routeGeometry,
            double bufferDistance)
        {
            var routeWkt = routeGeometry.AsText();

            return await _context.Incidents
                .FromSqlInterpolated($@"
            SELECT *
            FROM incidents i
            WHERE ST_DWithin(
                i.""Geom""::geography,
                ST_GeomFromText({routeWkt}, 4326)::geography,
                {bufferDistance}
            )
            ORDER BY i.""ReportedAt"" DESC
        ")
                .ToListAsync();
        }

        public async Task<bool> HasUserVotedAsync(Guid incidentId, Guid userId)
        {
            return await _context.IncidentsVotes
                .AnyAsync(x =>
                    x.IncidentId == incidentId &&
                    x.UserId == userId);
        }
        public async Task AddVoteAsync(IncidentsVote vote)
        {
            await _context.IncidentsVotes
                .AddAsync(vote);
        }
        public async Task<int> CountVotesAsync(Guid incidentId, TypeVote type)
        {
            return await _context.IncidentsVotes
                .CountAsync(x =>
                    x.IncidentId == incidentId &&
                    x.Type == type);
        }
        public async Task SaveChangesAsync()

        {

            await _context.SaveChangesAsync();

        }
    



    }
}

