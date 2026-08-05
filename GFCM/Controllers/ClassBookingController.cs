
  using GFCM.Models;
  using Microsoft.AspNetCore.Mvc;
  using MailKit.Net.Smtp;
  using MailKit.Security;
  using MimeKit;

  namespace GFCM.Controllers;

  // TODO (self-study): [Authorize]

  [ApiController]
  [Route("classbooking")]

  public class ClassBookingController : ControllerBase
  {
    private readonly ProjectContext context;
    private readonly IConfiguration configuration;

    public ClassBookingController(ProjectContext context, IConfiguration configuration)
    {
      this.context = context;
      this.configuration = configuration;
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
        TrySendBookingConfirmationEmail(user, schedule);
        return Ok("Booking created");
      }

      if (currentlyBooked >= schedule.capacity)
        return Conflict("Class is full");

      booking.bookingDate = DateTime.Now;
      booking.bookingStatus = BookingStatus.Booked;

      context.classBookings.Add(booking);
      context.SaveChanges();

      TrySendBookingConfirmationEmail(user, schedule);
      return Ok("Booking created");


    }

    //SELF-STUDY: booking confirmation email.

    private void TrySendBookingConfirmationEmail(User user, ClassSchedule schedule)
    {
      try
      {
        var smtpServer = configuration["EmailSettings:SmtpServer"];
        var smtpPort = int.Parse(configuration["EmailSettings:SmtpPort"] ?? "587");
        var senderName = configuration["EmailSettings:SenderName"];
        var senderEmail = configuration["EmailSettings:SenderEmail"];
        var username = configuration["EmailSettings:Username"];
        var password = configuration["EmailSettings:Password"];

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(senderName, senderEmail));
        message.To.Add(new MailboxAddress(user.userName, user.email));
        message.Subject = "Your class booking is confirmed!";
        message.Body = new TextPart("html")

        {
          Text = $"<p>Hi {user.userName},</p>" +
                 $"<p>You're booked into <b>{schedule.className}</b> " +
                 $"on {schedule.startTime:yyyy-MM-dd HH:mm}.</p>" +
                 "<p>See you there!</p>"
        };

        using var client = new SmtpClient();
        client.Connect(smtpServer, smtpPort, SecureSocketOptions.StartTls);
        client.Authenticate(username, password);
        client.Send(message);
        client.Disconnect(true);
      }

      catch (Exception ex)
      {
        Console.WriteLine($"Booking confirmation email failed to send: {ex.Message}");
      }
      
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
    
      
    
  }