using NetTopologySuite.Geometries;

namespace SiAman.Domain.Entities
{

public class UserHomeLocations
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public Users User { get; set; } = default!;

    public Point? HomeLocation { get; set; } = default!;

    public double Latitude { get; set; }

    public double Longitude { get; set; }

    public string Address { get; set; } = default!;

    public bool IsVerified { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}


}
