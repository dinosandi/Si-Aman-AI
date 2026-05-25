using SiAman.Domain.Enums;

namespace SiAman.Application.Common.Models
{
    public abstract record PaginationQuery
    {
        public int Page { get; init; } = 1;
        public int PageSize { get; init; } = 10;
        public string? Search { get; init; }
        public string? SortBy { get; init; }
        public bool SortDescending { get; init; } = false;
        public StatusProjects? Status { get; init; }
    }

}

