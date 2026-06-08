using System;

namespace SiAman.Application.Features.Emergency.DTOs
{

    public class ActiveAlertDto
    {
        public Guid AlertId { get; set; }
        public Guid UserId { get; set; }
        public string? UserName { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public DateTimeOffset TriggeredAt { get; set; }
        public List<EmergencyContactInfoDto> EmergencyContacts { get; set; } = new();
    }

    public class EmergencyContactInfoDto
    {
        public string ContactName { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public string? Relationship { get; set; }
        public bool IsPrimary { get; set; }
    }


}

