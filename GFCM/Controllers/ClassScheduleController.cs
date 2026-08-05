
using GFCM.Models;
using Microsoft.AspNetCore.Mvc;


namespace GFCM.Controllers;

    //TODO (self-study): [Authorize]

    [ApiController] 
    [Route("classschedule")]
    
    public class ClassScheduleController : ControllerBase
    {
        private readonly ProjectContext context;

        public ClassScheduleController(ProjectContext context)
        {
            this.context = context;
        }   
        
        //CASE 01 - Add a Class to the Timetable - POST classschedule/add
        [HttpPost("add")]
        public IActionResult Add([FromBody] ClassSchedule schedule)
        {
            var trainer = context.trainerProfiles
                .FirstOrDefault(t => t.trainerProfileId == schedule.trainerProfileId);
            if (trainer == null)
                return BadRequest("Trainer not found");
            
            var branch = context.branches
                .FirstOrDefault(b => b.branchId == schedule.branchId);
            if (branch == null)
                return BadRequest("Branch not found");
            
            if (schedule.endTime <= schedule.startTime)
                return BadRequest("endTime must be after startTime");

            if (schedule.capacity <= 0)
                return BadRequest("capacity must be greater than zero");
            
            bool clash = context.classSchedules.Any(c =>
                c.trainerProfileId == schedule.trainerProfileId &&
                c.startTime < schedule.endTime && c.endTime > schedule.startTime);
            if (clash)
                return Conflict("Trainer already has a class in that time slot");

            context.classSchedules.Add(schedule);
            context.SaveChanges();

            return Ok(new { schedule.classScheduleId });
            
        }
        
        
        

    }
