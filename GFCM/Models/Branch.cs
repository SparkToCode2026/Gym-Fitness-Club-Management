using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GFCM.Models
{
    public class Branch
    {
        [Key]
        [JsonIgnore]
        public int branchId { get; set; }

        [Required]
        public string branchName { get; set; }

        public string branchAddress { get; set; }
        public string branchCity { get; set; }
        public string branchPhone { get; set; }
        public string openingHours { get; set; }

        [InverseProperty("branch")]
        [JsonIgnore]
        public List<TrainerProfile> trainerProfiles { get; set; }

        [InverseProperty("branch")]
        [JsonIgnore]
        public List<Equipment> equipment { get; set; }
    }
}



