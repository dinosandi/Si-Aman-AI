using SiAman.Application.Common.Interfaces.Service;
using SiAman.Domain.Entities;
using SiAman.Domain.Enums;

namespace SiAman.Application.Common.Services
{
    public class SafetyScoreService : ISafetyScoreService
    {
        public double Calculate(
            List<RoadSafetySegments> roadSegments,
            List<Incidents>          incidents)
        {
            var baseScore = roadSegments.Any()
                ? roadSegments.Average(s => ConvertSafetyScore(s.SafetyScore))
                : 100.0; 

            var incidentPenalty = incidents.Count * 10;

            return Math.Clamp(baseScore - incidentPenalty, 0, 100);
        }

        private static double ConvertSafetyScore(SafetyScore score) =>
            score switch
            {
                SafetyScore.Aman      => 100,
                SafetyScore.Waspada  => 60,
                SafetyScore.Berbahaya => 20,
                _                     => 100
            };
    }
}