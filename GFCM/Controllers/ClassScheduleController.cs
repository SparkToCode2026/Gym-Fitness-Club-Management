
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
        
        
        //CASE 02 - Update a Class Slot
        [HttpPut("update")]
        public IActionResult Update(int classScheduleId, [FromBody] ClassSchedule updated)
        {
            var existing = context.classSchedules
                .FirstOrDefault(c => c.classScheduleId == classScheduleId);
            if (existing == null)
                return NotFound("Class not found");
            
            if (updated.endTime <= updated.startTime)
                return BadRequest("endTime must be after startTime");
            
            //Self-exclusion
            bool clash = context.classSchedules.Any(c =>
                c.classScheduleId != classScheduleId &&
                c.trainerProfileId == existing.trainerProfileId &&
                c.startTime < updated.endTime && c.endTime > updated.startTime);
            
            if (clash)
                return Conflict("Trainer already has a class in that time slot");

            int alreadyBooked = context.classBookings.Count(b =>
                b.classScheduleId == classScheduleId && b.bookingStatus == BookingStatus.Booked);

            if (updated.capacity < alreadyBooked)
                return Conflict("New capacity is below the number of existing bookings");

            existing.className = updated.className;
            existing.startTime = updated.startTime;
            existing.endTime = updated.endTime;
            existing.capacity = updated.capacity;

            context.SaveChanges();

            return Ok("Class updated");
            
        }
        
        
        

    }
