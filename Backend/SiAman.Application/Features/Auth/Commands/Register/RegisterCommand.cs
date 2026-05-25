using System;
using MediatR;
using SiAman.Domain.Enums;
using SiAman.Application.Common.Models;
using SiAman.Domain.Entities;

namespace SiAman.Application.Features.Auth.Commands.Register
{

    public class RegisterCommand : IRequest<ApiResponse<AuthResponse>>
    {
        public string Name { get; set; } = default!;
        public string Address { get; set; } = default!;
        public string Email { get; set; } = default!;
        public string Password { get; set; } = default!;
        public string PhoneNumber { get; set; } = default!;

        // Emergency Contact
        public List<EmergencyContactRequest> EmergencyContacts { get; set; } = new List<EmergencyContactRequest>();

        // Lokasi awal saat registrasi
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public Role Role { get; set; }
    }
    public sealed record EmergencyContactRequest
    {
        public string ContactName { get; init; } = default!;
        public string ContactPhone { get; init; } = default!;
        public string? Relationship { get; init; }
        public bool IsPrimary { get; init; } = false;
    }

}

