using FluentValidation;

namespace SiAman.Application.Features.Auth.Commands.LoginManualWithEmail
{
    public class LoginManualValidator : AbstractValidator<LoginManualCommand>
    {
        public LoginManualValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty()
                .EmailAddress().WithMessage("Format email tidak valid.");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password tidak boleh kosong.");
        }
    }
}