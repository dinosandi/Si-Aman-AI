using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using SiAman.Application.Common.Interfaces.Service;


namespace SiAman.Infrastructure.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly IWebHostEnvironment _env;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public LocalFileStorageService(
            IWebHostEnvironment env,
            IHttpContextAccessor httpContextAccessor)
        {
            _env = env;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> SaveAsync(
            IFormFile file,
            string folder,
            CancellationToken ct = default)
        {
            var webRootPath = _env.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot");
            }

            var uploadRoot = Path.Combine(
                webRootPath,
                "uploads",
                folder);

            Directory.CreateDirectory(uploadRoot);

            // ekstensi file
            var ext = Path.GetExtension(file.FileName)
                .ToLowerInvariant();

            // short guid
            var shortGuid = Guid.NewGuid()
                .ToString("N")
                .Substring(0, 8);

            // nama file unik
            var fileName =
                $"{DateTimeOffset.UtcNow:yyyyMMddHHmmss}_{shortGuid}{ext}";

            var filePath = Path.Combine(uploadRoot, fileName);

            // async stream agar tidak blocking
            await using var stream = new FileStream(
                filePath,
                FileMode.Create,
                FileAccess.Write,
                FileShare.None,
                81920,
                useAsync: true);

            await file.CopyToAsync(stream, ct);

            // generate public url
            var request = _httpContextAccessor.HttpContext!.Request;

            var baseUrl =
                $"{request.Scheme}://{request.Host}";

            return $"{baseUrl}/uploads/{folder}/{fileName}";
        }

        public Task DeleteAsync(string fileUrl, CancellationToken ct = default)
        {
            try
            {
                var request = _httpContextAccessor.HttpContext!.Request;
                var baseUrl = $"{request.Scheme}://{request.Host}";
                var relativePath = fileUrl.Replace(baseUrl, "").TrimStart('/');

                // uploads/incidents/2025-06/file.jpg → wwwroot/uploads/...
                var fullPath = Path.Combine(_env.WebRootPath, relativePath);
                if (File.Exists(fullPath))
                    File.Delete(fullPath);
            }
            catch
            {
                // log tapi jangan crash — file mungkin sudah tidak ada

            }

            return Task.CompletedTask;
        }

        public async Task<string> UploadFileAsync(byte[] fileData, string fileName, CancellationToken ct = default)
        {
            var uploadRoot = Path.Combine(_env.WebRootPath, "uploads");
            Directory.CreateDirectory(uploadRoot);

            var filePath = Path.Combine(uploadRoot, fileName);
            await File.WriteAllBytesAsync(filePath, fileData, ct);

            var request = _httpContextAccessor.HttpContext!.Request;
            var baseUrl = $"{request.Scheme}://{request.Host}";
            return $"{baseUrl}/uploads/{fileName}";
        }

        public Task DeleteFileAsync(string fileName, CancellationToken ct = default)
        {
            try
            {
                var uploadRoot = Path.Combine(_env.WebRootPath, "uploads");
                var filePath = Path.Combine(uploadRoot, fileName);
                if (File.Exists(filePath))
                    File.Delete(filePath);
            }
            catch
            {
                // log tapi jangan crash — file mungkin sudah tidak ada
            }

            return Task.CompletedTask;
        }
    }

}

