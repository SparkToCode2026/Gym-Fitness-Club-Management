using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GFCM.Models;

namespace GFCM.Controllers
{
    [ApiController]
    [Route("attendance")]
    public class AttendanceController : ControllerBase
    {
        // TODO (self-study): [Authorize]

        private readonly ProjectContext context;

        public AttendanceController(ProjectContext context)
        {
            this.context = context;
        }

        [HttpPost("add")]
        public IActionResult Add([FromBody] Attendance attendance)
        {
            bool userExists = context.users.Any(u => u.userId == attendance.userId);
            if (!userExists)
                return BadRequest("User not found");

            bool branchExists = context.branches.Any(b => b.branchId == attendance.branchId);
            if (!branchExists)
                return BadRequest("Branch not found");

            bool alreadyCheckedIn = context.attendances
                .Any(a => a.userId == attendance.userId && a.checkOutTime == null);
            if (alreadyCheckedIn)
                return BadRequest("Already checked in, check out first");

            attendance.attendanceDate = DateTime.Now.Date;
            attendance.checkInTime = DateTime.Now;
            attendance.checkOutTime = null;

            context.attendances.Add(attendance);
            context.SaveChanges();

            return Ok(new { message = "Checked in", id = attendance.attendanceId });
        }

        [HttpPut("update")]
        public IActionResult Update(int attendanceId, [FromBody] Attendance updated)
        {
            var attendance = context.attendances.FirstOrDefault(a => a.attendanceId == attendanceId);
            if (attendance == null)
                return NotFound("Attendance not found");

            if (updated.branchId != attendance.branchId)
            {
                bool branchExists = context.branches.Any(b => b.branchId == updated.branchId);
                if (!branchExists)
                    return BadRequest("Branch not found");
            }

            attendance.attendanceDate = updated.attendanceDate;
            attendance.branchId = updated.branchId;

            context.SaveChanges();
            return Ok("Attendance updated");
        }

        [HttpPatch("updateCheckOut")]
        public IActionResult UpdateCheckOut(int attendanceId)
        {
            var attendance = context.attendances.FirstOrDefault(a => a.attendanceId == attendanceId);
            if (attendance == null)
                return NotFound("Attendance not found");

            if (attendance.checkOutTime != null)
                return BadRequest("Already checked out");

            attendance.checkOutTime = DateTime.Now;
            context.SaveChanges();

            var duration = attendance.checkOutTime.Value - attendance.checkInTime;

            return Ok(new
            {
                message = "Checked out",
                checkInTime = attendance.checkInTime,
                checkOutTime = attendance.checkOutTime,
                duration = duration.ToString(@"hh\:mm\:ss")
            });
        }

        [HttpDelete("remove")]
        public IActionResult Remove(int attendanceId)
        {
            var attendance = context.attendances.FirstOrDefault(a => a.attendanceId == attendanceId);
            if (attendance == null)
                return NotFound("Attendance not found");

            context.attendances.Remove(attendance);
            context.SaveChanges();

            return Ok("Attendance record deleted");
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var records = context.attendances
                .Include(a => a.user)
                .Include(a => a.branch)
                .OrderByDescending(a => a.checkInTime)
                .Select(a => new
                {
                    a.attendanceId,
                    a.userId,
                    memberName = a.user,
                    a.branchId,
                    branchName = a.branch.branchName,
                    a.attendanceDate,
                    a.checkInTime,
                    a.checkOutTime
                })
                .ToList();

            return Ok(records);
        }

        [HttpGet("get")]
        public IActionResult Get(int attendanceId)
        {
            var record = context.attendances
                .Include(a => a.user)
                .Include(a => a.branch)
                .Where(a => a.attendanceId == attendanceId)
                .Select(a => new
                {
                    a.attendanceId,
                    a.userId,
                    memberName = a.user,
                    a.branchId,
                    branchName = a.branch.branchName,
                    a.attendanceDate,
                    a.checkInTime,
                    a.checkOutTime
                })
                .FirstOrDefault();

            if (record == null)
                return NotFound("Attendance not found");

            return Ok(record);
        }

        [HttpGet("getByDate")]
        public IActionResult GetByDate(DateTime? date, int? branchId, int? userId, bool? currentlyIn)
        {
            var query = context.attendances.AsQueryable();

            if (date.HasValue)
                query = query.Where(a => a.attendanceDate == date.Value.Date);

            if (branchId.HasValue)
                query = query.Where(a => a.branchId == branchId.Value);

            if (userId.HasValue)
                query = query.Where(a => a.userId == userId.Value);

            if (currentlyIn.HasValue && currentlyIn.Value)
                query = query.Where(a => a.checkOutTime == null);

            var result = query.ToList();

            return Ok(new { count = result.Count, records = result });
        }

        [HttpGet("averagePerBranch")]
        public IActionResult AveragePerBranch()
        {
            var daily = context.attendances
                .GroupBy(a => new { a.branchId, a.attendanceDate })
                .Select(g => new { g.Key.branchId, g.Key.attendanceDate, count = g.Count() })
                .ToList();

            var averages = daily
                .GroupBy(x => x.branchId)
                .Select(g => new { branchId = g.Key, averagePerDay = g.Average(x => x.count) })
                .ToList();

            var result = averages
                .Join(context.branches,
                    a => a.branchId,
                    b => b.branchId,
                    (a, b) => new
                    {
                        b.branchId,
                        b.branchName,
                        averagePerDay = Math.Round(a.averagePerDay, 1)
                    })
                .ToList();

            return Ok(result);
        }
    }
}
