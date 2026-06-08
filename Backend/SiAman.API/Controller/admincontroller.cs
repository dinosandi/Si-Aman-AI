using Microsoft.AspNetCore.Mvc;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using SiAman.Application.Features.OsmSeeder.Commands;


namespace SiAman.API.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class admincontroller : ControllerBase
    {
        private readonly IMediator _mediator;

        public admincontroller(IMediator mediator)
        {
            _mediator = mediator;
        }

        [Authorize]
        [HttpPost("seed/road-safety")]
        public async Task<IActionResult> SeedRoadSafety(
    [FromBody] SeedRoadSafetyCommand command)
        {
            var result = await _mediator.Send(command);
            return Ok(result);
        }
    }
}
