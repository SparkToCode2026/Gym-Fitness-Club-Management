using GFCM.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GFCM.Controllers
{
    [ApiController]
    [Route("workoutplan")]
    public class WorkoutPlanController : ControllerBase
    {
        private ProjectContext context;
        public WorkoutPlanController(ProjectContext context)
        {
            this.context = context;
        }


        //Case 09 — Create a Workout Plan
        [HttpPost("add")]
        public IActionResult AddWorkoutPlan(WorkoutPlan plan)
        {
            User user = context.users.FirstOrDefault(u => u.userId == plan.userId)!;
            if (user == null)
            {
                return NotFound("User not found");
            }

            if (plan.trainerProfileId != 0)
            {
                TrainerProfile trainer = context.trainerProfiles.FirstOrDefault(t => t.trainerProfileId == plan.trainerProfileId)!;
                if (trainer == null)
                {
                    return BadRequest("Trainer profile does not exist");
                }
            } 
            else
            {
                plan.trainerProfileId = null;
            }

            if (plan.endDate.HasValue && plan.endDate < plan.startDate)
            {
                return BadRequest("End date cannot be earlier than start date");
            }

            context.workoutPlans.Add(plan);
            context.SaveChanges();

            return Ok(plan.workoutPlanId);
        }


        //Case 10 — Update a Workout Plan
        [HttpPut("update")]
        public IActionResult UpdateWorkoutPlan(int workoutPlanId, WorkoutPlanUpdate updatedPlan)
        {
            WorkoutPlan plan = context.workoutPlans.FirstOrDefault(p => p.workoutPlanId == workoutPlanId)!;
            if (plan == null)
            {
                return NotFound("Workout plan does not exist");
            }

            if (updatedPlan.endDate.HasValue)
            {
                if (updatedPlan.endDate < plan.startDate)
                {
                    return BadRequest("End date cannot be earlier than start date");
                }

                plan.endDate = updatedPlan.endDate;
            }

            plan.planTitle = updatedPlan.planTitle;
            plan.planDescription = updatedPlan.planDescription;
            context.SaveChanges();

            return Ok("Workout plan updated successfully");
        }


        //Case 11 — Reassign a Plan to Another Trainer
        [HttpPatch("updateTrainer")]
        public IActionResult UpdateTrainer(int workoutPlanId, int? newTrainerProfileId)
        {
            WorkoutPlan plan = context.workoutPlans.FirstOrDefault(p => p.workoutPlanId == workoutPlanId)!;
            if (plan == null)
            {
                return NotFound("Workout plan does not exist");
            }

            if (newTrainerProfileId != 0)
            {
                TrainerProfile trainer = context.trainerProfiles.FirstOrDefault(t => t.trainerProfileId == newTrainerProfileId)!;
                if (trainer == null)
                {
                    return BadRequest("Trainer profile does not exist");
                }

                plan.trainerProfileId = newTrainerProfileId;
            }
            else
            {
                plan.trainerProfileId = null;
            }

            context.SaveChanges();

            return Ok("Workout plan reassigned successfully");
        }


        //Case 12 — Delete a Workout Plan
        [HttpDelete("remove")]
        public IActionResult RemoveWorkoutPlan(int workoutPlanId)
        {
            WorkoutPlan plan = context.workoutPlans.FirstOrDefault(p => p.workoutPlanId == workoutPlanId)!;
            if (plan == null)
            {
                return NotFound("Workout plan does not exist");
            }

            context.workoutPlans.Remove(plan);
            context.SaveChanges();

            return Ok("Workout plan deleted successfully");
        }


        //Case 13 — Get All Workout Plans
        [HttpGet("getAll")]
        public IActionResult GetAllWorkoutPlans()
        {
            var plans = context.workoutPlans
            .Include(p => p.user)
            .Include(p => p.trainerProfile)
            .ThenInclude(t => t.user)
            .Select(p => new
            {
                p.workoutPlanId,
                p.planTitle,
                p.planDescription,
                p.startDate,
                p.endDate,
                user = new
                {
                    p.user.userId,
                    p.user.userName,
                    p.user.email
                },
                trainerProfile = p.trainerProfile != null ? new
                {
                    p.trainerProfile.trainerProfileId,
                    user = new
                    {
                        p.trainerProfile.user.userId,
                        p.trainerProfile.user.userName,
                        p.trainerProfile.user.email
                    }
                } : null
            })
            .ToList();

            return Ok(plans);
        }


        //Case 14 — Get a Workout Plan
        [HttpGet("get")]
        public IActionResult GetWorkoutPlan(int workoutPlanId)
        {
            WorkoutPlan plan = context.workoutPlans.FirstOrDefault(p => p.workoutPlanId == workoutPlanId)!;
            if (plan == null)
            {
                return NotFound("Workout plan does not exist");
            }

            return Ok(plan);
        }


        //Case 15 — A Member's Plans
        [HttpGet("getByUser")]
        public IActionResult GetWorkoutPlansByUser(int userId)
        {
            var plans = context.workoutPlans
            .Include(p => p.user)
            .Include(p => p.trainerProfile)
            .OrderByDescending(p => p.startDate)
            .Where(p => p.user.userId == userId)
            .ToList();

            return Ok(plans);
        }


        //Case 16 — Currently Active Plans
        [HttpGet("getActive")]
        public IActionResult GetActiveWorkoutPlans()
        {
            var plans = context.workoutPlans
            .Include(w => w.user)
            .Include(w => w.trainerProfile)
            .Where(w => w.startDate <= DateTime.Now &&
                        (w.endDate == null || w.endDate >= DateTime.Now))
            .OrderBy(w => w.startDate)
            .ToList();

            return Ok(plans);
        }
    }
}
