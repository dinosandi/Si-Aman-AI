using MediatR;
using SiAman.Application.Common.Exceptions;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Common.Interfaces.Service;

namespace SiAman.Application.Features.Incidents.Commands.DeleteIncident;

public class DeleteIncidentHandler(
    IIncidentRepository incidentRepository,
    ICurrentUserService currentUserService,
    IFileStorageService fileStorageService
) : IRequestHandler<DeleteIncidentCommand, Unit>
{
    public async Task<Unit> Handle(DeleteIncidentCommand request, CancellationToken cancellationToken)
    {
        var incident = await incidentRepository.GetByIdAsync(request.IncidentId, cancellationToken)
            ?? throw new NotFoundException("Incident tidak ditemukan.");

        if (incident.UserId != currentUserService.UserId!.Value)
            throw new NotFoundException("Anda tidak memiliki akses untuk menghapus incident ini.");

        // Hapus gambar dari storage jika ada
        if (!string.IsNullOrEmpty(incident.ImageUrl))
            await fileStorageService.DeleteAsync(incident.ImageUrl, cancellationToken);

        await incidentRepository.DeleteIncidentAsync(incident, cancellationToken);

        return Unit.Value;
    }
}