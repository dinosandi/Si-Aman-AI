using System;
using SiAman.Domain.Entities;
using NetTopologySuite.Geometries;


namespace SiAman.Application.Common.Interfaces.Repository
{
    public interface IUserRepository
    {
        Task<Users?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
        Task<Users> GetUserByEmail(string Email);
        Task<Users> GetUsersAsync(string email, string name);
        Task<Users> UpdateAsync(Guid userId, CancellationToken ct = default);
        Task UpdateLocationAsync(Guid userId, Point point, double latitude, double longitude, CancellationToken ct = default);
        Task AddUserAsync(Users user);
        Task<UserHomeLocations?> GetUserHomeLocationAsync(Guid userId);
        Task SaveChangesAsync();
    }
}

