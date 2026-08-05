using GFCM.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GFCM.Controllers
{
    [ApiController]
    [Route("user")]
    public class UserController : ControllerBase
    {
        private ProjectContext context;
        public UserController(ProjectContext context)
        {
            this.context = context;
        }


        [HttpPost("add")]
        public IActionResult AddUser(UserRegister register)
        {
            if (context.users.Any(u => u.email == register.email))
                return BadRequest("Email already registered");

            User user = new User
            {
                userName = register.userName,
                email = register.email,
                passwordHash = BCrypt.Net.BCrypt.HashPassword(register.password),
                role = register.role,
                phoneNumber = register.phoneNumber,
                createdAt = DateTime.Now,
                isActive = true
            };
            context.users.Add(user);
            context.SaveChanges();
            // TODO (self-study): send activation email
            return Ok(user.userId);
        }


        [HttpPut("update")]
        public IActionResult UpdateUser(int id, UserUpdate update)
        {
            var user = context.users.FirstOrDefault(u => u.userId == id);
            if (user == null)
            {
                return NotFound("User not found");
            }

            user.userName = update.userName;
            user.phoneNumber = update.phoneNumber;

            context.users.Update(user);
            context.SaveChanges();

            return Ok(user);
        }


        [HttpPatch("updateRole")]
        public IActionResult UpdateUserRole(int id, UserRole role)
        {
            var user = context.users.FirstOrDefault(u => u.userId == id);
            if (user == null)
            {
                return NotFound("User not found");
            }

            if (role != UserRole.Admin && role != UserRole.Trainer && role != UserRole.Member)
            {
                return BadRequest("Invalid role");
            }

            user.role = role;

            context.users.Update(user);
            context.SaveChanges();
            return Ok(user);
        }


        [HttpDelete("delete")]
        public IActionResult DeleteUser(int id) {
            var user = context.users.FirstOrDefault(u => u.userId == id);
            if (user == null)
            {
                return NotFound("User not found");
            }

            user.isActive = false;
            context.SaveChanges();
            return Ok(user);
        }


        [HttpGet("getAll")]
        public IActionResult GetAllUsers()
        {
            var users = context.users
            .Include(u => u.trainerProfile)
            .Select(u => new {
                u.userId,
                u.userName,
                u.email,
                u.role,
                u.isActive,
                specialization = u.trainerProfile.specialization!
            })
            .ToList();

            return Ok(users);
        }


        [HttpGet("get")]
        public IActionResult GetUser(int id)
        {
            var user = context.users.FirstOrDefault(u => u.userId == id);

            if (user == null)
            {
                return NotFound("User not found");
            }

            return Ok(user);
        }


        [HttpGet("getByRole")]
        public IActionResult GetUsersByRole(UserRole role)
        {
            var users = context.users
            .Where(u => u.role == role)
            .ToList();

            return Ok(users);
        }


        [HttpGet("countByRole")]
        public IActionResult CountUsersByRole()
        {
            var count = context.users
            .GroupBy(u => u.role)
            .Select(g => new { role = g.Key, count = g.Count() })
            .ToList();

            return Ok(count);
        }
    }
}
