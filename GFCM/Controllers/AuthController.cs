using GFCM.Models;
using GFCM.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GFCM.Controllers
{
    [ApiController]
    [Route("auth")]
    public class AuthController : ControllerBase
    {
        private readonly ProjectContext context;
        private readonly IJwtService jwtService;

        public AuthController(ProjectContext context, IJwtService jwtService)
        {
            this.context = context;
            this.jwtService = jwtService;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public IActionResult Login(UserLogin userLogin)
        {
            User user = context.users.FirstOrDefault(u => u.email == userLogin.email)!;
            if (user == null)
            {
                return BadRequest("Invalid email or password.");
            }

            if (BCrypt.Net.BCrypt.Verify(userLogin.password, user.passwordHash) == false)
            {
                return BadRequest("Invalid email or password.");
            }

            if (user.isActive == false)
            {
                return BadRequest("User account is inactive.");
            }

            string token = jwtService.GenerateToken(user);
            DateTime expiryTime = DateTime.UtcNow.AddHours(2);

            return Ok(new
            {
                Token = token,
                Name = user.userName,
                Role = user.role.ToString(),
                ExpiresAt = expiryTime
            });
        }
    }
}
