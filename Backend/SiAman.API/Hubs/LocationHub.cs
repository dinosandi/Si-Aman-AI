using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using MediatR;
using SiAman.Application.Features.Location.Commands;


namespace SiAman.API.Hubs
{

 
    public class LocationHub : Hub
    {
        private readonly IMediator _mediator;

        public LocationHub(IMediator mediator)
        {
            _mediator = mediator;
        }

        // Dipanggil dari FE setiap GPS update
        public async Task UpdateLocation(UpdateLocationRequest request)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("Unauthorized");
            }

            var command = new UpdateUserLocationCommand
            {
                UserId    = Guid.Parse(userId),
                Latitude  = request.Latitude,
                Longitude = request.Longitude,
                Accuracy  = request.Accuracy,
                Speed     = request.Speed,
                Heading   = request.Heading,
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                throw new HubException(result.Message);
            }

            // Kirim konfirmasi balik ke client yg sama
            await Clients.Caller.SendAsync("LocationUpdated", new
            {
                latitude  = request.Latitude,
                longitude = request.Longitude,
                updatedAt = DateTimeOffset.UtcNow
            });
        }
    }

    public class UpdateLocationRequest
    {
        public double  Latitude  { get; set; }
        public double  Longitude { get; set; }
        public double? Accuracy  { get; set; }
        public double? Speed     { get; set; }
        public double? Heading   { get; set; }
    }


}
