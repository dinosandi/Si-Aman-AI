using FluentValidation;
using SiAman.Domain.Enums;

namespace SiAman.Application.Features.Incidents.Commands.CreateIncident
{
    public class CreateIncidentValidator : AbstractValidator<CreateIncidentCommand>
    {
        private readonly string[] AllowedTypes =
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        public CreateIncidentValidator()
        {
            // Type Incident
            RuleFor(x => x.Type)
                .IsInEnum()
                .WithMessage("Tipe insiden tidak valid.");

            // Description
            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Deskripsi tidak boleh kosong.")
                .MaximumLength(1000)
                .WithMessage("Deskripsi maksimal 1000 karakter.");

            // Latitude
            RuleFor(x => x.Latitude)
                .InclusiveBetween(-90, 90)
                .WithMessage("Latitude harus antara -90 dan 90.");

            // Longitude
            RuleFor(x => x.Longitude)
                .InclusiveBetween(-180, 180)
                .WithMessage("Longitude harus antara -180 dan 180.");

            // Image wajib
            RuleFor(x => x.Image)
                .NotNull()
                .WithMessage("Gambar wajib diunggah.");

            // Format file
            RuleFor(x => x.Image)
                .Must(file =>
                    file != null &&
                    AllowedTypes.Contains(file.ContentType))
                .WithMessage("Format gambar harus JPG, PNG, atau WebP.");

            // Maksimal 5 MB
            RuleFor(x => x.Image)
                .Must(file =>
                    file != null &&
                    file.Length <= 5 * 1024 * 1024)
                .WithMessage("Ukuran gambar maksimal 5 MB.");

            // jika other
            When(x => x.Type == TypeIncidents.Other, () =>
                {
                    RuleFor(x => x.Other)
                        .NotEmpty()
                        .WithMessage("Keterangan wajib diisi jika tipe insiden adalah Lainnya.")
                        .MaximumLength(255)
                        .WithMessage("Keterangan maksimal 255 karakter.");
                });
        }
    }
}