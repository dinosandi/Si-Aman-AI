using System.Text.Json.Serialization;

namespace SiAman.Application.Features.Navigation.DTOs
{

    public class RouteGeometryDto
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = "LineString";

        // [longitude, latitude]
        [JsonPropertyName("coordinates")]
        public List<List<double>> Coordinates { get; set; } = [];



    }

}

