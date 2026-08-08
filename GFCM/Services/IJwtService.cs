using GFCM.Models;

namespace GFCM.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
    }
}
