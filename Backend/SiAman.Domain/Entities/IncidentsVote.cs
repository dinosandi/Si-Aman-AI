using System;
using SiAman.Domain.Enums;

namespace SiAman.Domain.Entities
{
    public class IncidentsVote
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Users User { get; set; }
        public Guid IncidentId { get; set; }
        public Incidents Incident { get; set; }
        public TypeVote Type { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}

