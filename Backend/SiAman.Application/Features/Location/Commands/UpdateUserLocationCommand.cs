using MediatR;
using SiAman.Application.Common.Models;

namespace SiAman.Application.Features.Location.Commands
{

public class UpdateUserLocationCommand : IRequest<ApiResponse<bool>>
    {
        public Guid    UserId    { get; set; }
        public double  Latitude  { get; set; }
        public double  Longitude { get; set; }
        public double? Accuracy  { get; set; }
        public double? Speed     { get; set; }
        public double? Heading   { get; set; }
    }

}

