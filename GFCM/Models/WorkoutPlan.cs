using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GFCM.Models
{
    public class WorkoutPlan
    {
        // primary key, hidden so the client never sends it
        [Key]
        [JsonIgnore]
        public int workoutPlanId { get; set; }

        // the name of the programme, like "12 week strength"
        [Required]
        public string planTitle { get; set; }

        // the member the plan was written for, never editable after creation
        [ForeignKey("user")]
        public int userId { get; set; }

        [JsonIgnore]
        public User user { get; set; }

        // nullable on purpose, null means the member wrote it themselves
        // the int? is what makes ef treat this relationship as optional
        [ForeignKey("trainerProfile")]
        public int? trainerProfileId { get; set; }

        [JsonIgnore]
        public TrainerProfile? trainerProfile { get; set; }

        public string planDescription { get; set; }

        public DateTime startDate { get; set; }

        // null means an open ended plan with no finish date, case 16 depends on this
        public DateTime? endDate { get; set; }
    }
}
