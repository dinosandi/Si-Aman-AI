using System;
using SiAman.Domain.Entities;

namespace SiAman.Application.Common.Interfaces.Service
{
  public interface IUserService
  {
    Task<Users> GetUserByName(string Name);
    Task<Users> GetUserByEmail(string Email);
    Task<Users> GetUsersAsync(string email, string name);
    }
}

