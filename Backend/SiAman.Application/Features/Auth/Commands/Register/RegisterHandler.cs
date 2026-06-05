using MediatR;
using SiAman.Application.Common.Exceptions;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Models;
using SiAman.Domain.Entities;
using SiAman.Domain.Enums;
using NetTopologySuite.Geometries;


namespace SiAman.Application.Features.Auth.Commands.Register;

public class RegisterHandler
    : IRequestHandler<RegisterCommand, ApiResponse<AuthResponse>>
{
    private readonly IUserRepository _userRepository;

    public RegisterHandler(
        IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<ApiResponse<AuthResponse>> Handle(
        RegisterCommand request,
        CancellationToken cancellationToken)
    {
        var existingEmail =
            await _userRepository.GetUserByEmail(request.Email);

        if (existingEmail != null)
            throw new BadRequestException(
                "Email sudah terdaftar.");

        var hashedPassword =
            BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = new Users
        {
            Id = Guid.NewGuid(),

            Name = request.Name,
            Address = request.Address,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,

            Password = hashedPassword,

            Role = Role.User,

            IsProfileCompleted = true, // Anggap profil sudah lengkap karena semua field wajib diisi saat registrasi

            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        foreach (var contact in request.EmergencyContacts)
        {
            user.EmergencyContacts.Add(
                new EmergencyContacts
                {
                    Id = Guid.NewGuid(),

                    ContactName = contact.ContactName,
                    ContactPhone = contact.ContactPhone,
                    Relationship = contact.Relationship,
                    IsPrimary = contact.IsPrimary
                });
        }

        if (request.Latitude.HasValue &&
            request.Longitude.HasValue)
        {
            user.HomeLocations.Add(
            new UserHomeLocations
            {
                Id = Guid.NewGuid(),

                Latitude = request.Latitude.Value,
                Longitude = request.Longitude.Value,

                HomeLocation = new Point(
                    request.Longitude.Value,
                    request.Latitude.Value)
                {
                    SRID = 4326
                },
                Address = request.Address,
            });
                }

        await _userRepository.AddUserAsync(user);

        await _userRepository.SaveChangesAsync();

        return ApiResponse<AuthResponse>.SuccessResponse(
            new AuthResponse
            {
                UserId = user.Id,

                Name = user.Name,

                Email = user.Email,

                Role = user.Role.ToString(),

                IsProfileCompleted = true
            },
            "Registrasi berhasil.");
    }
}