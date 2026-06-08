using FluentValidation;

namespace SiAman.Application.Features.Incidents.Commands.VoteIncident;

public class VoteIncidentValidator
    : AbstractValidator<VoteIncidentCommand>
{
    public VoteIncidentValidator()
    {
        RuleFor(x => x.IncidentId)
            .NotEmpty();

        RuleFor(x => x.Type)
            .IsInEnum();
    }
}