using MediatR;
using SiAman.Application.Common.Models;

namespace SiAman.Application.Features.Auth.Queries.GetCurrentUser;

// Query tidak butuh input — user diambil dari JWT cookie via ICurrentUserService
public record GetCurrentUserQuery : IRequest<ApiResponse<CurrentUserDto>>;

// DTO — hanya expose field yang dibutuhkan FE
public record CurrentUserDto(
    Guid Id,
    string Name,
    string Email,
    string Role,
    string Provider,
    string? AvatarUrl
);