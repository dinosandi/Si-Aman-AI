using Microsoft.AspNetCore.Http;


namespace SiAman.Application.Common.Interfaces.Service
{

    public interface IFileStorageService
    {
        // untuk menyimpan file dan mengembalikan URL file yang sudah disimpan untuk diakses
        Task<string> UploadFileAsync(byte[] fileBytes, string fileName, CancellationToken ct = default);
        Task DeleteFileAsync(string fileUrl, CancellationToken ct = default);
        Task<string> SaveAsync(
        IFormFile file,
        string folder,
        CancellationToken ct = default);
        Task DeleteAsync(string filePath, CancellationToken cancellationToken);
  

    }

}

