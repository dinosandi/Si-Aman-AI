using FluentValidation;

namespace SiAman.Application.Features.Auth.Commands.Register
{
    public class RegisterValidator : AbstractValidator<RegisterCommand>
    {
        // Format nomor telepon
        private const string PhoneRegex = @"^(\+62|62|0)8[1-9][0-9]{6,10}$";

        public RegisterValidator()
        {
            // ── Nama 
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Nama lengkap wajib diisi.")
                .MinimumLength(3).WithMessage("Nama minimal 3 karakter.")
                .MaximumLength(100).WithMessage("Nama maksimal 100 karakter.");

            // Email 
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email wajib diisi.")
                .EmailAddress().WithMessage("Format email tidak valid.");

            // ── Password 
            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password wajib diisi.")
                .MinimumLength(8).WithMessage("Password minimal 8 karakter.")
                .Matches(@"[A-Z]").WithMessage("Password harus mengandung minimal 1 huruf kapital.")
                .Matches(@"[0-9]").WithMessage("Password harus mengandung minimal 1 angka.");

            // ── Nomor Telepon 
            RuleFor(x => x.PhoneNumber)
                .NotEmpty().WithMessage("Nomor telepon wajib diisi.")
                .Matches(PhoneRegex).WithMessage("Format nomor telepon tidak valid. Contoh: 08123456789");

            // ── Alamat ──
            RuleFor(x => x.Address)
                .NotEmpty().WithMessage("Alamat wajib diisi.")
                .MinimumLength(10).WithMessage("Alamat terlalu pendek, minimal 10 karakter.")
                .MaximumLength(500).WithMessage("Alamat maksimal 500 karakter.");

            // ── Lokasi GPS (opsional, tapi jika dikirim harus valid) 
            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90, 90)
                .WithMessage("Latitude harus antara -90 dan 90.")
                .When(x => x.Latitude.HasValue);

            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180, 180)
                .WithMessage("Longitude harus antara -180 dan 180.")
                .When(x => x.Longitude.HasValue);

            // Lat & Lng harus selalu berpasangan
            RuleFor(x => x.Longitude)
                .NotNull().WithMessage("Longitude wajib diisi jika Latitude dikirim.")
                .When(x => x.Latitude.HasValue);

            RuleFor(x => x.Latitude)
                .NotNull().WithMessage("Latitude wajib diisi jika Longitude dikirim.")
                .When(x => x.Longitude.HasValue);

            // ── Kontak Darurat 
            
        }
    }
}