using SiAman.Domain.Entities;

namespace SiAman.Application.Common.Interfaces.Repository
{

    public interface IUserLocationRepository
    {
        Task<UserLocations?>GetLatestLocationAsync(Guid userId);

    }
}

