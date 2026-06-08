using FluentValidation;

namespace SiAman.Application.Features.Incidents.Commands.DeleteIncident;

public class DeleteIncidentValidator : AbstractValidator<DeleteIncidentCommand>
{
    public DeleteIncidentValidator()
    {
        RuleFor(x => x.IncidentId)
            .NotEmpty().WithMessage("Incident ID tidak boleh kosong.");
    }
}