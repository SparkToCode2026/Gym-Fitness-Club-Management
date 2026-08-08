using GFCM.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GFCM.Controllers;

// TODO (self-study): [Authorize]

[ApiController]
[Route("classbooking")]

public class ClassBookingController : ControllerBase
{
  private readonly ProjectContext context;

  public ClassBookingController(ProjectContext context)
  {
    this.context = context;
  }

  //Case 09 — Book a Member into a Class
  [HttpPost("add")]
  public IActionResult Add([FromBody] ClassBooking booking)
  {
    var schedule = context.classSchedules
      .FirstOrDefault(c => c.classScheduleId == booking.classScheduleId);
    if (schedule == null)
      return BadRequest("Class not found");

    var user = context.users.FirstOrDefault(u => u.userId == booking.userId);
    if (user == null)
      return BadRequest("User not found");

    var existing = context.classBookings.FirstOrDefault(b =>
      b.userId == booking.userId && b.classScheduleId == booking.classScheduleId);

    int currentlyBooked = context.classBookings.Count(b =>
      b.classScheduleId == booking.classScheduleId && b.bookingStatus == BookingStatus.Booked);

    if (existing != null)
    {
      if (existing.bookingStatus == BookingStatus.Booked)
        return BadRequest("Already booked into this class");

      if (currentlyBooked >= schedule.capacity)
        return Conflict("Class is full");

      existing.bookingStatus = BookingStatus.Booked;
      existing.bookingDate = DateTime.Now;

      context.SaveChanges();
      return Ok("Booking created");
    }

    if (currentlyBooked >= schedule.capacity)
      return Conflict("Class is full");

    booking.bookingDate = DateTime.Now;
    booking.bookingStatus = BookingStatus.Booked;

    context.classBookings.Add(booking);
    context.SaveChanges();

    // TODO (self-study): booking confirmation email fires here

    return Ok("Booking created");
  }

  //Case 10 — Move a Booking to Another Class
  [HttpPut("update")]
  public IActionResult Update(int userId, int classScheduleId, int newClassScheduleId)
  {
    var existing = context.classBookings.FirstOrDefault(b =>
      b.userId == userId && b.classScheduleId == classScheduleId);
    if (existing == null)
      return NotFound("Booking not found");

    var targetSchedule = context.classSchedules
      .FirstOrDefault(c => c.classScheduleId == newClassScheduleId);
    if (targetSchedule == null)
      return NotFound("Target class not found");

    bool alreadyBookedTarget = context.classBookings.Any(b =>
      b.userId == userId && b.classScheduleId == newClassScheduleId);
    if (alreadyBookedTarget)
      return BadRequest("Already booked into the target class");

    int bookedInTarget = context.classBookings.Count(b =>
      b.classScheduleId == newClassScheduleId && b.bookingStatus == BookingStatus.Booked);
    if (bookedInTarget >= targetSchedule.capacity)
      return Conflict("Class is full");

    context.classBookings.Remove(existing);
    context.classBookings.Add(new ClassBooking
    {
      userId = existing.userId,
      classScheduleId = newClassScheduleId,
      bookingDate = existing.bookingDate,
      bookingStatus = existing.bookingStatus
    });

    context.SaveChanges();

    return Ok("Booking moved");
  }

  //Case 11 — Mark Attendance or Cancel
  [HttpPatch("updateStatus")]
  public IActionResult UpdateStatus(int userId, int classScheduleId, BookingStatus newStatus)
  {
    var booking = context.classBookings.FirstOrDefault(b =>
      b.userId == userId && b.classScheduleId == classScheduleId);
    if (booking == null)
      return NotFound("Booking not found");

    booking.bookingStatus = newStatus;
    context.SaveChanges();

    return Ok("Booking status updated");
  }

  //Case 12 — Cancel a Booking
  [HttpDelete("remove")]
  public IActionResult Remove(int userId, int classScheduleId)
  {
    var booking = context.classBookings.FirstOrDefault(b =>
      b.userId == userId && b.classScheduleId == classScheduleId);
    if (booking == null)
      return NotFound("Booking not found");

    booking.bookingStatus = BookingStatus.Cancelled;
    context.SaveChanges();

    return Ok("Booking cancelled");
  }

  //Case 13 — Get All Bookings
  [HttpGet("getAll")]
  public IActionResult GetAll()
  {
    var bookings = context.classBookings
      .Include(b => b.user)
      .Include(b => b.classSchedule)
      .Select(b => new
      {
        b.userId,
        b.classScheduleId,
        b.bookingDate,
        bookingStatus = b.bookingStatus.ToString(),
        memberName = b.user!.userName,
        className = b.classSchedule!.className
      })
      .ToList();

    return Ok(bookings);
  }

  //Case 14 — Get a Booking
  [HttpGet("get")]
  public IActionResult Get(int userId, int classScheduleId)
  {
    var booking = context.classBookings
      .Include(b => b.user)
      .Include(b => b.classSchedule)
      .Where(b => b.userId == userId && b.classScheduleId == classScheduleId)
      .Select(b => new
      {
        b.userId,
        b.classScheduleId,
        b.bookingDate,
        bookingStatus = b.bookingStatus.ToString(),
        memberName = b.user!.userName,
        className = b.classSchedule!.className
      })
      .FirstOrDefault();

    if (booking == null)
      return NotFound("Booking not found");

    return Ok(booking);
  }

  //Case 15 — A Member's Bookings
  [HttpGet("getByUser")]
  public IActionResult GetByUser(int userId, string? status)
  {
    var query = context.classBookings.Where(b => b.userId == userId);

    if (!string.IsNullOrEmpty(status) &&
        Enum.TryParse<BookingStatus>(status, true, out var parsedStatus))
    {
      query = query.Where(b => b.bookingStatus == parsedStatus);
    }

    var bookings = query
      .Include(b => b.classSchedule)
      .OrderByDescending(b => b.bookingDate)
      .Select(b => new
      {
        b.classScheduleId,
        b.bookingDate,
        bookingStatus = b.bookingStatus.ToString(),
        className = b.classSchedule!.className,
        startTime = b.classSchedule!.startTime
      })
      .ToList();

    return Ok(new { count = bookings.Count, bookings });
  }

  //Case 16 — Bookings per Class
  [HttpGet("countByClass")]
  public IActionResult CountByClass()
  {
    var grouped = context.classBookings
      .GroupBy(b => b.classScheduleId)
      .Select(g => new
      {
        classScheduleId = g.Key,
        totalBookings = g.Count(),
        attended = g.Count(b => b.bookingStatus == BookingStatus.Attended)
      })
      .OrderByDescending(g => g.totalBookings)
      .ToList();

    var scheduleIds = grouped.Select(g => g.classScheduleId).ToList();
    var scheduleNames = context.classSchedules
      .Where(c => scheduleIds.Contains(c.classScheduleId))
      .ToDictionary(c => c.classScheduleId, c => c.className);

    var result = grouped.Select(g => new
    {
      g.classScheduleId,
      className = scheduleNames.ContainsKey(g.classScheduleId) ? scheduleNames[g.classScheduleId] : null,
      g.totalBookings,
      g.attended
    }).ToList();

    return Ok(result);
  }

  [HttpGet("getByStatus")]
  public IActionResult GetBookingsByStatus(BookingStatus status)
  {
    var bookings = context.classBookings
      .Where(b => b.bookingStatus == status)
      .ToList();

    return Ok(bookings);
  }
}