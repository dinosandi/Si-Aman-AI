
namespace SiAman.Application.Common.Interfaces.Service
{
    public interface ICookieService
    {
        void SetAccessToken(string token);
        void SetRefreshToken(string token);
        string? GetAccessToken();
        string? GetRefreshToken();
        void ClearAuthCookies();
    }
}
