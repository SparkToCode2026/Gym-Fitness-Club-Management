using System.ComponentModel.DataAnnotations;            
using System.ComponentModel.DataAnnotations.Schema;     
using System.Text.Json.Serialization;

namespace GFCM.Models
{
    public class ClassSchedule
    {
        [Key]
        [JsonIgnore]
        public int classScheduleId { get; set; }

        [Required]
        public string className { get; set; }

        [ForeignKey("trainerProfile")]
        public int trainerProfileId { get; set; }

        [JsonIgnore]
        public TrainerProfile trainerProfile { get; set; }

        [ForeignKey("branch")]
        public int branchId { get; set; }

        [JsonIgnore]
        public Branch branch { get; set; }

        public DateTime startTime { get; set; }
        public DateTime endTime { get; set; }
        public int capacity { get; set; }

        [InverseProperty("classSchedule")]
        [JsonIgnore]
        public List<ClassBooking> bookings { get; set; }
    }
}