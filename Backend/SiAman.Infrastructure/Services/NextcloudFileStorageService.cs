using System.Net;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using SiAman.Application.Common.Interfaces.Service;

namespace SiAman.Infrastructure.Services
{
    /// <summary>
    /// Menyimpan file ke Nextcloud melalui WebDAV dan mengembalikan URL publik share.
    /// Config (appsettings.json → "Nextcloud"):
    ///   WebDavUrl   : URL WebDAV dasar, cth. https://cloud.example.com/remote.php/dav/files/USERNAME/
    ///   Username    : app-password username
    ///   Password    : app-password token
    ///   PublicShareUrl : URL share publik tanpa trailing slash, cth. https://cloud.example.com/s/SHAREID
    /// </summary>
    public class NextcloudFileStorageService : IFileStorageService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _webDavUrl;
        private readonly string _publicShareUrl;
        private readonly string _username;
        private readonly string _password;

        public NextcloudFileStorageService(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;

            var section = configuration.GetSection("Nextcloud");
            _webDavUrl      = section["WebDavUrl"]       ?? throw new InvalidOperationException("Nextcloud:WebDavUrl tidak dikonfigurasi.");
            _publicShareUrl = section["PublicShareUrl"]  ?? throw new InvalidOperationException("Nextcloud:PublicShareUrl tidak dikonfigurasi.");
            _username       = section["Username"]        ?? throw new InvalidOperationException("Nextcloud:Username tidak dikonfigurasi.");
            _password       = section["Password"]        ?? throw new InvalidOperationException("Nextcloud:Password tidak dikonfigurasi.");
        }

        /// <summary>Upload via IFormFile (dipakai CreateIncidentHandler).</summary>
        public async Task<string> SaveAsync(
            IFormFile file,
            string folder,
            CancellationToken ct = default)
        {
            // Baca konten file
            await using var ms = new MemoryStream();
            await file.CopyToAsync(ms, ct);
            var bytes = ms.ToArray();

            var ext      = Path.GetExtension(file.FileName).ToLowerInvariant();
            var shortId  = Guid.NewGuid().ToString("N")[..8];
            var fileName = $"{DateTimeOffset.UtcNow:yyyyMMddHHmmss}_{shortId}{ext}";
            var remotePath = $"{folder}/{fileName}";

            await PutFileAsync(remotePath, bytes, file.ContentType, ct);

            // URL download langsung dari share Nextcloud (WebDAV download path)
            // Format: <PublicShareUrl>/download?path=/&files=<folder>/<fileName>
            return $"{_publicShareUrl}/download?path=%2F{Uri.EscapeDataString(folder)}&files={Uri.EscapeDataString(fileName)}";
        }

        /// <summary>Upload via byte array.</summary>
        public async Task<string> UploadFileAsync(
            byte[] fileData,
            string fileName,
            CancellationToken ct = default)
        {
            await PutFileAsync(fileName, fileData, "application/octet-stream", ct);
            return $"{_publicShareUrl}/download?path=%2F&files={Uri.EscapeDataString(fileName)}";
        }

        public Task DeleteAsync(string fileUrl, CancellationToken ct = default)
        {
            // Nextcloud share bersifat read-only dari sisi publik; delete tidak diperlukan
            // Jika perlu, implementasi DELETE via WebDAV bisa ditambahkan di sini
            return Task.CompletedTask;
        }

        public Task DeleteFileAsync(string fileName, CancellationToken ct = default)
            => DeleteAsync(fileName, ct);

        // ── Helpers ────────────────────────────────────────────────────────────

        private async Task PutFileAsync(
            string remotePath,
            byte[] data,
            string contentType,
            CancellationToken ct)
        {
            var client = _httpClientFactory.CreateClient("Nextcloud");

            // Pastikan folder remote ada (MKCOL)
            var folder = Path.GetDirectoryName(remotePath)?.Replace('\\', '/');
            if (!string.IsNullOrEmpty(folder))
            {
                await EnsureFolderAsync(client, folder, ct);
            }

            var uploadUrl = $"{_webDavUrl.TrimEnd('/')}/{remotePath.TrimStart('/')}";

            var content = new ByteArrayContent(data);
            content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

            var response = await client.PutAsync(uploadUrl, content, ct);

            if (!response.IsSuccessStatusCode && response.StatusCode != HttpStatusCode.Created)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                throw new InvalidOperationException(
                    $"Gagal upload ke Nextcloud [{response.StatusCode}]: {body}");
            }
        }

        private async Task EnsureFolderAsync(HttpClient client, string folderPath, CancellationToken ct)
        {
            // Buat semua segmen folder secara rekursif
            var segments = folderPath.Split('/', StringSplitOptions.RemoveEmptyEntries);
            var current  = "";

            foreach (var segment in segments)
            {
                current = string.IsNullOrEmpty(current)
                    ? segment
                    : $"{current}/{segment}";

                var url  = $"{_webDavUrl.TrimEnd('/')}/{current}";
                var req  = new HttpRequestMessage(new HttpMethod("MKCOL"), url);
                var resp = await client.SendAsync(req, ct);

                // 201 = Created, 405 = sudah ada → keduanya OK
                if (resp.StatusCode != HttpStatusCode.Created &&
                    resp.StatusCode != HttpStatusCode.MethodNotAllowed &&
                    resp.StatusCode != HttpStatusCode.Conflict)
                {
                    // Abaikan error lain agar tidak memblokir upload utama
                }
            }
        }
    }
}
