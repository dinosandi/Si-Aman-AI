using SiAman.Application.Common.Interfaces.Service;
using SiAman.Domain.Entities;
using SiAman.Domain.Enums;

namespace SiAman.Infrastructure.Services
{
    public class SafetyScoreService : ISafetyScoreService
    {
        public double Calculate(List<RoadSafetySegments> segments)
        {
            if (segments.Count == 0)
                return 100.0; // tidak ada data insiden = anggap aman

            // SafetyScore adalah enum — konversi ke nilai numerik
            // Sesuaikan mapping ini dengan nilai enum SafetyScore di domain Anda
            var scores = segments.Select(s => MapScore(s.SafetyScore)).ToList();

            return Math.Round(scores.Average(), 2);
        }

        private static double MapScore(SafetyScore score) => score switch
        {
            SafetyScore.Aman => 100.0,
            SafetyScore.Waspada => 60.0,
            SafetyScore.Berbahaya => 20.0,
            _ => 50.0
        };

    }
}
