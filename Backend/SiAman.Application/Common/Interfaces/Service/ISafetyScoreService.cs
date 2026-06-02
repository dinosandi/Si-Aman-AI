using SiAman.Domain.Entities;

namespace SiAman.Application.Common.Interfaces.Service;

public interface ISafetyScoreService
{
    double Calculate(List<RoadSafetySegments> segments);
}
