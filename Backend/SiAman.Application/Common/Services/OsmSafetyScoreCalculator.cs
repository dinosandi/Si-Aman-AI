using SiAman.Application.Common.Interfaces.Service;
using SiAman.Domain.Enums;

namespace SiAman.Application.Common.Services
{
    public static class OsmSafetyScoreCalculator
    {
       
        public static SafetyScore Calculate(OsmWayDto way)
        {
            var score = 100;

            // Jalan besar = lebih ramai = lebih berisiko
            score -= way.Highway switch
            {
                "primary"      => 20,
                "secondary"    => 15,
                "tertiary"     => 10,
                "residential"  => 5,
                _              => 0
            };

            // Tidak ada lampu jalan
            if (way.Tags.TryGetValue("lit", out var lit) && lit == "no")
                score -= 15;

            // Kecepatan max tinggi
            if (way.Tags.TryGetValue("maxspeed", out var maxspeed) &&
                int.TryParse(maxspeed, out var speed))
            {
                if (speed >= 80) score -= 20;
                else if (speed >= 60) score -= 10;
            }

            // Tidak ada trotoar
            if (way.Tags.TryGetValue("sidewalk", out var sidewalk) &&
                sidewalk is "none" or "no")
                score -= 10;

            // Permukaan jalan buruk
            if (way.Tags.TryGetValue("surface", out var surface) &&
                surface is "unpaved" or "dirt" or "gravel")
                score -= 15;

            score = Math.Clamp(score, 0, 100);

            return score switch
            {
                >= 80 => SafetyScore.Aman,       
                >= 50 => SafetyScore.Waspada,
                _     => SafetyScore.Berbahaya
            };
        }
    }
}