using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;

namespace SiAman.API.Controller;

/// <summary>
/// Proxy endpoint: stream file dari Nextcloud WebDAV ke browser.
/// URL: GET /api/media/{**path}
/// Contoh: /api/media/SiAman/incidents/2026-06/filename.jpg
/// </summary>
[ApiController]
[Route("api/media")]
public class MediaController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _webDavUrl;
    private readonly string _basicAuth;

    public MediaController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;

        var nc       = configuration.GetSection("Nextcloud");
        _webDavUrl   = nc["WebDavUrl"]?.TrimEnd('/') ?? "";
        var username = nc["Username"] ?? "";
        var password = nc["Password"] ?? "";
        _basicAuth   = Convert.ToBase64String(
            System.Text.Encoding.UTF8.GetBytes($"{username}:{password}"));
    }

    [HttpGet("{**filePath}")]
    public async Task<IActionResult> GetMedia(string filePath, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(filePath))
            return NotFound();

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", _basicAuth);

        var fileUrl = $"{_webDavUrl}/{filePath.TrimStart('/')}";

        HttpResponseMessage response;
        try
        {
            response = await client.GetAsync(fileUrl, HttpCompletionOption.ResponseHeadersRead, ct);
        }
        catch
        {
            return StatusCode(502, "Tidak dapat terhubung ke storage.");
        }

        if (!response.IsSuccessStatusCode)
            return NotFound();

        var contentType = response.Content.Headers.ContentType?.ToString()
                          ?? "application/octet-stream";

        var stream = await response.Content.ReadAsStreamAsync(ct);

        Response.Headers["Cache-Control"] = "public, max-age=86400";
        return File(stream, contentType);
    }
}
