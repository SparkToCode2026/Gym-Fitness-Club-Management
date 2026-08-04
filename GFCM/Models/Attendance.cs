using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GFCM.Models
{
    public class Attendance
    {
        // primary key, hidden so the client never sends it
        [Key]
        [JsonIgnore]
        public int attendanceId { get; set; }

        // which member walked in
        [ForeignKey("user")]
        public int userId { get; set; }

        [JsonIgnore]
        public User user { get; set; }

        // which branch they visited
        [ForeignKey("branch")]
        public int branchId { get; set; }

        [JsonIgnore]
        public Branch branch { get; set; }

        // just the day, no time, so case 08 can group all of one day's visits together
        // the column type keeps sql server from storing a time part too
        [Column(TypeName = "date")]
        public DateTime attendanceDate { get; set; }

        // the full timestamp of when they scanned in
        public DateTime checkInTime { get; set; }

        // null means they are still inside the gym right now
        // this is what the open session guard and the currentlyIn filter both look at
        public DateTime? checkOutTime { get; set; }
    }
}