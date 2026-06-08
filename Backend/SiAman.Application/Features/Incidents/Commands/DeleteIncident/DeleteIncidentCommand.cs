using MediatR;

namespace SiAman.Application.Features.Incidents.Commands.DeleteIncident
{
    
public record DeleteIncidentCommand(Guid IncidentId) : IRequest<Unit>;

}
