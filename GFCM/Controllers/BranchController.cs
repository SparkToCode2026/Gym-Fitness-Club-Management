using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GFCM.Models;
using Microsoft.AspNetCore.Authorization;

namespace GFCM.Controllers
{
    [ApiController]
    [Route("branch")]
    [Authorize]
    public class BranchController : ControllerBase
    {
        private readonly ProjectContext context;

        public BranchController(ProjectContext context)
        {
            this.context = context;
        }

        [HttpPost("add")]
        public IActionResult Add([FromBody] Branch newBranch)
        {
            bool exists = context.branches
                .Any(b => b.branchName == newBranch.branchName
                        && b.branchCity == newBranch.branchCity);

            if (exists)
                return Conflict("Branch already exists in that city");

            context.branches.Add(newBranch);
            context.SaveChanges();

            return Ok(new { message = "Branch created", id = newBranch.branchId });
        }

        [HttpPut("update")]
        public IActionResult Update(int branchId, [FromBody] Branch updated)
        {
            var branch = context.branches.FirstOrDefault(b => b.branchId == branchId);
            if (branch == null)
                return NotFound("Branch not found");

            branch.branchName = updated.branchName;
            branch.branchAddress = updated.branchAddress;
            branch.branchCity = updated.branchCity;
            branch.branchPhone = updated.branchPhone;

            context.SaveChanges();
            return Ok("Branch updated");
        }

        [HttpPatch("updateHours")]
        public IActionResult UpdateHours(int branchId, string openingHours)
        {
            var branch = context.branches.FirstOrDefault(b => b.branchId == branchId);
            if (branch == null)
                return NotFound("Branch not found");

            branch.openingHours = openingHours;
            context.SaveChanges();

            return Ok("Opening hours updated");
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("remove")]
        public IActionResult Remove(int branchId)
        {
            var branch = context.branches.FirstOrDefault(b => b.branchId == branchId);
            if (branch == null)
                return NotFound("Branch not found");

            if (context.trainerProfiles.Any(t => t.branchId == branchId))
                return Conflict("Cannot delete: TrainerProfiles reference this branch");

            if (context.classSchedules.Any(c => c.branchId == branchId))
                return Conflict("Cannot delete: ClassSchedules reference this branch");

            if (context.equipment.Any(e => e.branchId == branchId))
                return Conflict("Cannot delete: Equipment references this branch");

            context.branches.Remove(branch);
            context.SaveChanges();

            return Ok("Branch deleted");
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var branches = context.branches
                .Include(b => b.trainerProfiles)
                .Include(b => b.equipment)
                .Select(b => new
                {
                    b.branchId,
                    b.branchName,
                    b.branchCity,
                    b.branchAddress,
                    b.branchPhone,
                    b.openingHours,
                    trainerCount = b.trainerProfiles.Count(),
                    equipmentCount = b.equipment.Count()
                })
                .ToList();

            return Ok(branches);
        }

        [HttpGet("get")]
        public IActionResult Get(int branchId)
        {
            var branch = context.branches
                .Include(b => b.trainerProfiles)
                .Include(b => b.equipment)
                .Where(b => b.branchId == branchId)
                .Select(b => new
                {
                    b.branchId,
                    b.branchName,
                    b.branchCity,
                    b.branchAddress,
                    b.branchPhone,
                    b.openingHours,
                    trainerCount = b.trainerProfiles.Count(),
                    equipmentCount = b.equipment.Count()
                })
                .FirstOrDefault();

            if (branch == null)
                return NotFound("Branch not found");

            return Ok(branch);
        }

        [HttpGet("getByCity")]
        public IActionResult GetByCity(string city)
        {
            var result = context.branches
                .Where(b => b.branchCity.ToLower() == city.ToLower())
                .ToList();

            return Ok(new { count = result.Count, branches = result });
        }

        [HttpGet("staffCount")]
        public IActionResult StaffCount()
        {
            var report = context.branches
                .Select(b => new
                {
                    b.branchId,
                    b.branchName,
                    b.branchCity,
                    trainers = b.trainerProfiles.Count(),
                    equipmentRecords = b.equipment.Count(),
                    totalUnits = b.equipment.Sum(e => (int?)e.quantity) ?? 0
                })
                .OrderByDescending(x => x.trainers)
                .ToList();

            return Ok(report);
        }
    }
}