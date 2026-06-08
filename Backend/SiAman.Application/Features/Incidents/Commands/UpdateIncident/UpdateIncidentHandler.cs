using MediatR;
using SiAman.Application.Common.Exceptions;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;
using SiAman.Application.Features.Incidents.DTOs;
using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Incidents.Commands.UpdateIncident;

public class UpdateIncidentHandler(
    IIncidentRepository incidentRepository,
    ICurrentUserService currentUserService
) : IRequestHandler<UpdateIncidentCommand, IncidentResponseDto>
{
    public async Task<IncidentResponseDto> Handle(UpdateIncidentCommand request, CancellationToken cancellationToken)
    {
        var incident = await incidentRepository.GetByIdAsync(request.IncidentId, cancellationToken)
            ?? throw new NotFoundException("Incident tidak ditemukan.");

        // Validasi transisi status
        var validTransitions = new Dictionary<StatusIncidents, List<StatusIncidents>>
        {
            { StatusIncidents.MenungguVerifikasi, [StatusIncidents.Terverifikasi, StatusIncidents.Ditolak] },
            { StatusIncidents.Terverifikasi,      [StatusIncidents.Berhasil] },
            { StatusIncidents.Ditolak,            [] },
            { StatusIncidents.Berhasil,           [] },
        };

        if (!validTransitions[incident.Status].Contains(request.Status))
            throw new BadRequestException(
                $"Tidak dapat mengubah status dari '{incident.Status}' ke '{request.Status}'.");

        incident.Status    = request.Status;
        incident.UpdatedAt = DateTimeOffset.UtcNow;

        // Set ResolvedAt jika status final
        if (request.Status is StatusIncidents.Berhasil or StatusIncidents.Ditolak)
            incident.ResolvedAt = DateTimeOffset.UtcNow;

        await incidentRepository.UpdateAsync(incident, cancellationToken);

        return new IncidentResponseDto
        {
            Id                  = incident.Id,
            Type                = incident.Type,
            Other               = incident.Other,
            ImageUrl            = incident.ImageUrl,
            Description         = incident.Description,
            LocationDescription = incident.LocationDescription,
            Latitude            = incident.Latitude,
            Longitude           = incident.Longitude,
            Status              = incident.Status,
            ReportedAt          = incident.ReportedAt,
            ResolvedAt          = incident.ResolvedAt,
            CreatedAt           = incident.CreatedAt,
            UpdatedAt           = incident.UpdatedAt
        };
    }
}