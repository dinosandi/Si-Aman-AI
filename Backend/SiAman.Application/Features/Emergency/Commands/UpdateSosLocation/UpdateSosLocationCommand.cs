using System;
using MediatR;

namespace SiAman.Application.Features.Emergency.Commands.UpdateSosLocation
{
    public record UpdateSosLocationCommand(Guid AlertId, double Latitude, double Longitude)
    : IRequest<bool>;

}
