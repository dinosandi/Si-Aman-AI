using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SiAman.Application.Features.Incidents.Commands.CreateIncident;
using SiAman.Application.Features.Incidents.Commands.DeleteIncident;
using SiAman.Application.Features.Incidents.Commands.UpdateIncident;
using SiAman.Application.Features.Incidents.Commands.VoteIncident;
using SiAman.Application.Features.Incidents.DTOs;
using SiAman.Application.Features.Incidents.Queries;

namespace SiAman.API.Controller
{
    [ApiController]
    [Route("api/incidents")]
    [Authorize]
    public class IncidentController : ControllerBase
    {
        private readonly IMediator _mediator;

        public IncidentController(IMediator mediator)
        {
            _mediator = mediator;
        }
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] CreateIncidentDto dto)
        {
            var command = new CreateIncidentCommand
            {
                Type = dto.Type,
                Other = dto.Other,
                Description = dto.Description,
                LocationDescription = dto.LocationDescription,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Image = dto.Image
            };

            var result = await _mediator.Send(command);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id}/vote")]
        public async Task<IActionResult> Vote(
    Guid id,
    [FromBody] IncidentVoteDto dto)
        {
            var command = new VoteIncidentCommand
            {
                IncidentId = id,
                Type = dto.Type
            };

            var result = await _mediator.Send(command);

            return Ok(result);
        }

        [HttpPut("{id:guid}")]
        [Authorize]
        public async Task<IActionResult> UpdateIncident(
    Guid id,
    [FromForm] UpdateIncidentDto dto)
        {
            var result = await _mediator.Send(new UpdateIncidentCommand(id, dto.Status));
            return Ok(new { Success = true,  Message = "Incident berhasil diperbarui.", Data = result });
        }

        [HttpDelete("{id:guid}")]
        [Authorize]
        public async Task<IActionResult> DeleteIncident(Guid id)
        {
            var result = await _mediator.Send(new DeleteIncidentCommand(id));
            return Ok(new { Success = true, Message = "Incident berhasil dihapus." });
        }




        // mengambil laporan insiden terdekat berdasarkan koordinat dan radius
        [HttpGet("nearby")]
        public async Task<IActionResult> GetNearby(
            [FromQuery] double lat,
            [FromQuery] double lon,
            [FromQuery] double radius = 1000)
        {
            var query = new GetIncidentsQuery
            {
                Latitude = lat,
                Longitude = lon,
                RadiusMeters = radius
            };

            var result = await _mediator.Send(query);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        // mengambil semua laporan insiden
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var query = new GetAllIncidentsQuery();
            var result = await _mediator.Send(query);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        
        /// Detail satu laporan
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            // Bisa dikembangkan dengan GetIncidentByIdQuery jika diperlukan
            return Ok();
        }
    }
}
