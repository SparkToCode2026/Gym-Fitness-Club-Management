using System.ComponentModel.DataAnnotations;

namespace GFCM.Models
{
    public class WorkoutPlanUpdate
    {
        [Required]
        public string planTitle { get; set; }
        public string planDescription { get; set; }
        public DateTime? endDate { get; set; }
    }
}
