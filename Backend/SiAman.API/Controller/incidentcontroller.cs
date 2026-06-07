using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SiAman.Application.Common.Interfaces.Repository;
using SiAman.Application.Features.Incidents.Commands.CreateIncident;
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
        private readonly IIncidentRepository _incidentRepo;

        public IncidentController(IMediator mediator, IIncidentRepository incidentRepo)
        {
            _mediator = mediator;
            _incidentRepo = incidentRepo;
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

        [HttpPut("{id:guid}/verify")]
        public async Task<IActionResult> Verify(Guid id, CancellationToken ct)
        {
            var incident = await _incidentRepo.GetByIdTrackedAsync(id, ct);
            if (incident == null) return NotFound(new { success = false, message = "Laporan tidak ditemukan" });

            incident.Status = Domain.Enums.StatusIncidents.Terverifikasi;
            incident.UpdatedAt = DateTimeOffset.UtcNow;
            await _incidentRepo.SaveChangesAsync();

            return Ok(new { success = true, message = "Laporan berhasil diverifikasi", data = new { id = incident.Id } });
        }

        [HttpPut("{id:guid}/reject")]
        public async Task<IActionResult> Reject(Guid id, CancellationToken ct)
        {
            var incident = await _incidentRepo.GetByIdTrackedAsync(id, ct);
            if (incident == null) return NotFound(new { success = false, message = "Laporan tidak ditemukan" });

            incident.Status = Domain.Enums.StatusIncidents.Ditolak;
            incident.UpdatedAt = DateTimeOffset.UtcNow;
            await _incidentRepo.SaveChangesAsync();

            return Ok(new { success = true, message = "Laporan berhasil ditolak", data = new { id = incident.Id } });
        }

        [HttpPut("{id:guid}/resolve")]
        public async Task<IActionResult> Resolve(Guid id, CancellationToken ct)
        {
            var incident = await _incidentRepo.GetByIdTrackedAsync(id, ct);
            if (incident == null) return NotFound(new { success = false, message = "Laporan tidak ditemukan" });

            incident.Status = Domain.Enums.StatusIncidents.Berhasil;
            incident.ResolvedAt = DateTimeOffset.UtcNow;
            incident.UpdatedAt = DateTimeOffset.UtcNow;
            await _incidentRepo.SaveChangesAsync();

            return Ok(new { success = true, message = "Laporan berhasil diselesaikan", data = new { id = incident.Id } });
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
        {
            var incident = await _incidentRepo.GetByIdTrackedAsync(id, ct);
            if (incident == null) return NotFound(new { success = false, message = "Laporan tidak ditemukan" });

            await _incidentRepo.DeleteIncidentAsync(incident, ct);

            return Ok(new { success = true, message = "Laporan berhasil dihapus" });
        }
    }
}
