using MediatR;
using SiAman.Application.Common.Models;

namespace SiAman.Application.Features.Emergency.Commands.TriggerSos
{

public record TriggerSosCommand(double Latitude, double Longitude) 
    : IRequest<ApiResponse<Guid>>;


}

