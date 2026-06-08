using MediatR;
using SiAman.Application.Common.Models;

namespace SiAman.Application.Features.OsmSeeder.Commands
{
    public class SeedRoadSafetyCommand : IRequest<ApiResponse<SeedRoadSafetyResultDto>>
    {
        // Bounding box area yang ingin di-seed
        // Contoh: Kota Kediri
        public double SouthLat { get; set; }
        public double WestLon  { get; set; }
        public double NorthLat { get; set; }
        public double EastLon  { get; set; }
    }

    public class SeedRoadSafetyResultDto
    {
        public int TotalFetched  { get; set; }
        public int TotalInserted { get; set; }
        public int TotalSkipped  { get; set; }  // sudah ada di DB
    }
}