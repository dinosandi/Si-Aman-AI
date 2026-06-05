using SiAman.Domain.Entities;

namespace SiAman.Application.Common.Models
{
    public class RefreshTokenResult
    {
        public string TokenRaw { get; set; } = default!;

        public RefreshTokens Entity { get; set; } = default!;
    }
}