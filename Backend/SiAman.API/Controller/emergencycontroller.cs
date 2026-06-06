using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SiAman.Application.Features.Emergency.Commands.ResolveSos;
using SiAman.Application.Features.Emergency.Queries.GetActiveAlerts;
using SiAman.Domain.Enums;

namespace SiAman.API.Controller
{
    [ApiController]
    [Route("api/emergency")]
    [Authorize]
    public class EmergencyController : ControllerBase
    {
        private readonly IMediator _mediator;
        public EmergencyController(IMediator mediator) => _mediator = mediator;

        // Admin: load semua alert aktif saat buka dashboard
        [HttpGet("active")]
        [Authorize(Roles = nameof(Role.Admin))]
        public async Task<IActionResult> GetActive(CancellationToken ct)
            => Ok(await _mediator.Send(new GetActiveAlertsQuery(), ct));

        // Admin: resolve via REST
        [HttpPatch("{alertId:guid}/resolve")]
        [Authorize(Roles = nameof(Role.Admin))]
        public async Task<IActionResult> Resolve(Guid alertId, CancellationToken ct)
            => Ok(await _mediator.Send(new ResolveSosCommand(alertId), ct));
    }

}
