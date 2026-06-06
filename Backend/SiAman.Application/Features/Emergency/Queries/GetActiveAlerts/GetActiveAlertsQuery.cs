using System;
using MediatR;
using SiAman.Application.Common.Models;
using SiAman.Application.Features.Emergency.DTOs;

namespace SiAman.Application.Features.Emergency.Queries.GetActiveAlerts
{

public record GetActiveAlertsQuery : IRequest<ApiResponse<List<ActiveAlertDto>>>;

}

