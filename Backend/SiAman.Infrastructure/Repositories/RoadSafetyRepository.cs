using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Domain.Entities;
using SiAman.Infrastructure.Persistence;


namespace SiAman.Infrastructure.Repositories
{
    public class RoadSafetyRepository : IRoadSafetyRepository
    {
        private readonly AppDbContext _context;

        public RoadSafetyRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<RoadSafetySegments>> GetIntersectedSegmentsAsync(
            Geometry routeGeometry)
        {
            // ST_Intersects lewat NTS — EF Core + NetTopologySuite
            // menerjemahkan .Intersects() ke fungsi spasial PostgreSQL
            return await _context.RoadSafetySegments
                .Where(s => s.Geom.Intersects(routeGeometry))
                .AsNoTracking()
                .ToListAsync();
        }
    }

}

