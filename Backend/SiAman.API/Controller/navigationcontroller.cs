using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using SiAman.Application.Features.Navigation.Queries;


namespace SiAman.API.Controller
{
    [ApiController]
    [Route("api/navigation")]
    public class NavigationController : ControllerBase
    {
        private readonly IMediator _mediator;

        public NavigationController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost("safe-route")]
        [Authorize]
        public async Task<IActionResult> GetSafeRoute(
            GetSafeRouteQuery query)
        {
            var result =
                await _mediator.Send(query);

            return Ok(result);
        }
    }
}
