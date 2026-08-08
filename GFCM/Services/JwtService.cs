using GFCM.Models;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace GFCM.Services
{
    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;

        public JwtService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user)
        {
            // 1. Fetch values from appsettings.json configuration mapping
            var secretKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Secret Key is not configured.");
            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            // 2. Build the standard JWT and Role identity claims list
            var claims = new[]
            {
                // Fully qualify the ambiguous names
                new Claim(JwtRegisteredClaimNames.Sub, user.userId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("role", user.role.ToString())
            };


            // 3. Create security keys and set up the HMAC-SHA256 signing credentials
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            // 4. Instantiate the token payload envelope
            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2), // Sets expiration window
                signingCredentials: credentials);

            // 5. Serialize and sign the final token block payload into a string
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
