using FluentValidation;
using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Incidents.Commands.UpdateIncident;

public class UpdateIncidentValidator : AbstractValidator<UpdateIncidentCommand>
{
    public UpdateIncidentValidator()
    {
        RuleFor(x => x.IncidentId)
            .NotEmpty().WithMessage("Incident ID tidak boleh kosong.");

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Status tidak valid.");
    }
}