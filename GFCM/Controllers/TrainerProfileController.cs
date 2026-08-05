using GFCM.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GFCM.Controllers
{
    [ApiController]
    [Route("trainerprofile")]
    public class TrainerProfileController : ControllerBase
    {
        private ProjectContext context;
        public TrainerProfileController(ProjectContext context)
        {
            this.context = context;
        }


        [HttpPost("add")]
        public IActionResult AddTrainerProfile(TrainerProfile profile)
        {
            User user = context.users.FirstOrDefault(u => u.userId == profile.userId)!;
            if (user == null)
            {
                return BadRequest("User does not exist");
            }

            Branch branch = context.branches.FirstOrDefault(b => b.branchId == profile.branchId)!;
            if (branch == null)
            {
                return BadRequest("Branch does not exist");
            }

            if (context.trainerProfiles.Any(p => p.userId == profile.userId))
            {
                return Conflict("Trainer profile already exists");
            }

            context.trainerProfiles.Add(profile);
            context.SaveChanges();

            return Ok(profile.trainerProfileId);
        }


        [HttpPut("update")]
        public IActionResult UpdateTrainerProfile(int trainerProfileId, TrainerProfileUpdate updatedProfile)
        {
            TrainerProfile profile = context.trainerProfiles.FirstOrDefault(p => p.trainerProfileId == trainerProfileId)!;
            if (profile == null)
            {
                return NotFound("Trainer profile does not exist");
            }

            profile.bio = updatedProfile.bio;
            profile.specialization = updatedProfile.specialization;
            profile.yearsOfExperience = updatedProfile.yearsOfExperience;
            profile.certificationDetails = updatedProfile.certificationDetails;
            context.SaveChanges();

            return Ok("Trainer profile updated successfully");
        }


        [HttpPatch("updateBranch")]
        public IActionResult UpdateTrainerProfileBranch(int trainerProfileId, int newBranchId)
        {
            TrainerProfile profile = context.trainerProfiles.FirstOrDefault(p => p.trainerProfileId == trainerProfileId)!;
            if (profile == null)
            {
                return NotFound("Trainer profile does not exist");
            }

            Branch branch = context.branches.FirstOrDefault(b => b.branchId == newBranchId)!;
            if (branch == null)
            {
                return NotFound("Branch does not exist");
            }

            profile.branchId = newBranchId;
            context.SaveChanges();

            return Ok("Trainer profile branch updated successfully");
        }


        [HttpDelete("remove")]
        public IActionResult RemoveTrainerProfile(int trainerProfileId)
        {
            TrainerProfile profile = context.trainerProfiles.FirstOrDefault(p => p.trainerProfileId == trainerProfileId)!;
            if (profile == null)
            {
                return NotFound("Trainer profile does not exist");
            }

            ClassSchedule schedule = context.classSchedules.FirstOrDefault(s => s.trainerProfileId == trainerProfileId)!;
            if (schedule != null)
            {
                return Conflict("Reassign this trainer's classes first");
            }

            context.trainerProfiles.Remove(profile);
            context.SaveChanges();

            return Ok("Trainer profile removed successfully");
        }


        [HttpGet("getAll")]
        public IActionResult GetAllTrainerProfiles()
        {
            var profiles = context.trainerProfiles
            .Include(t => t.user)
            .Include(t => t.branch)
            .Select(t => new
            {
                t.trainerProfileId,
                t.specialization,
                t.yearsOfExperience,
                trainerName = t.user.userName,
                branchName = t.branch.branchName!
            })
            .ToList();
            return Ok(profiles);
        }


        [HttpGet("get")]
        public IActionResult GetTrainerProfile(int trainerProfileId)
        {
            TrainerProfile profile = context.trainerProfiles
            .Include(t => t.user)
            .Include(t => t.branch)
            .FirstOrDefault(p => p.trainerProfileId == trainerProfileId)!;
            if (profile == null)
            {
                return NotFound("Trainer profile does not exist");
            }

            return Ok(profile);
        }


        [HttpGet("getBySpecialization")]
        public IActionResult GetTrainerProfilesBySpecialization(string specialization, int? branchId)
        {
            var query = context.trainerProfiles
            .Include(t => t.user)
            .Include(t => t.branch)
            .Where(t => t.specialization.Contains(specialization));

            if (branchId != null)
            {
                query = query.Where(t => t.branchId == branchId.Value);
            }

            var profiles = query
            .Select(t => new
            {
                t.trainerProfileId,
                t.specialization,
                t.yearsOfExperience,
                trainerName = t.user.userName,
                branchName = t.branch.branchName!
            })
            .ToList();

            return Ok(profiles);
        }


        [HttpGet("getByExperience")]
        public IActionResult GetTrainerProfilesByExperience()
        {
            List<TrainerProfile> profiles = context.trainerProfiles
            .Include(t => t.user)
            .OrderByDescending(t => t.yearsOfExperience)
            .ToList();

            return Ok(profiles);
        }
    }
}
