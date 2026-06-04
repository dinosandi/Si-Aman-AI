using System;

namespace SiAman.Application.Features.Navigation.DTOs
{

    public class RouteGeometryDto
    {
        public string Type { get; set; } = "LineString";

        // [longitude, latitude]
        public List<List<double>> Coordinates { get; set; } = [];



    }

}

