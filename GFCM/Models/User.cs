using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GFCM.Models
{
    public class User
    {
        [Key]
        [JsonIgnore]
        public int userId { get; set; }
        [Required]
        public string userName { get; set; }
        public string email { get; set; }
        [JsonIgnore]
        public string passwordHash { get; set; }
        public enum role
        {
            Admin,
            Trainer,
            Member
        }
        public string phoneNumber { get; set; }
        public DateTime createdAt { get; set; }
        public bool isActive { get; set; }


        [InverseProperty("trainerProfile")]
        [JsonIgnore]
        public TrainerProfile trainerProfile { get; set; }
    }
}
