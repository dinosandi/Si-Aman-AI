using MediatR;
using SiAman.Application.Common.Models;

namespace SiAman.Application.Features.Emergency.Commands.ResolveSos
{
    // ResolveSosCommand.cs
    public record ResolveSosCommand(Guid AlertId) : IRequest<ApiResponse<bool>>;
}