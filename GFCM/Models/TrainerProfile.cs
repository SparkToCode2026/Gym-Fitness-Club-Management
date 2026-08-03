using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GFCM.Models
{
    public class TrainerProfile
    {
        [Key]
        [JsonIgnore]
        public int trainerProfileId { get; set; }


        [ForeignKey("user")]
        public int userId { get; set; }
        [JsonIgnore]
        public User user { get; set; }


        [ForeignKey("branch")]
        public int branchId { get; set; }
        [JsonIgnore]
        public Branch branch { get; set; }


        public string specialization { get; set; }
        public string bio { get; set; }
        public int yearsOfExperience { get; set; }
        public string certificationDetails { get; set; }
    }
}
