using System;
using MediatR;
using SiAman.Application.Common.Models;

namespace SiAman.Application.Features.Emergency.Commands.TriggerSos
{
    public record TriggerSosCommand(double Latitude, double Longitude, Guid? UserId = null) 
        : IRequest<ApiResponse<Guid>>;
}


