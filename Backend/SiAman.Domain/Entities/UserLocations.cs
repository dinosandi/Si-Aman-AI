using NetTopologySuite.Geometries; 

namespace SiAman.Domain.Entities
{
    public class UserLocations
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public Users User { get; set; } = default!;

        // PostGIS Point — SRID 4326 (WGS84, standar GPS)
        // Ingat: X = Longitude, Y = Latitude
        public Point Location { get; set; } = default!;

        // Kolom redundan tapi memudahkan query & serialisasi JSON
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public double? Accuracy { get; set; }   // akurasi GPS dalam meter
        public double? Speed { get; set; }       // m/s
        public double? Heading { get; set; }     // arah 0–360 derajat

        public DateTimeOffset RecordedAt { get; set; }
    }
}