using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GFCM.Models
{
    [PrimaryKey("userId", "classScheduleId")]
    public class ClassBooking
    {
        [ForeignKey("user")]
        public int userId { get; set; }
        [JsonIgnore]
        public User user { get; set; }

        [ForeignKey("classSchedule")]
        public int classScheduleId { get; set; }
        [JsonIgnore]
        public ClassSchedule classSchedule { get; set; }

        public DateTime bookingDate { get; set; }

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public BookingStatus bookingStatus { get; set; }
    }

    public enum BookingStatus
    {
        Booked,
        Cancelled,
        Attended
    }
}