using MediatR;
using SiAman.Application.Features.Incidents.DTOs;
using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Incidents.Commands.UpdateIncident;

public record UpdateIncidentCommand(
    Guid IncidentId,
    StatusIncidents Status
) : IRequest<IncidentResponseDto>;