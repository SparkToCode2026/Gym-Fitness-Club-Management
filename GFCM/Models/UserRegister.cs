using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace GFCM.Models
{
    public class UserRegister
    {
        [Required]
        public string userName { get; set; }
        [Required]
        public string email { get; set; }
        [Required]
        public string password { get; set; }
        public string phoneNumber { get; set; }

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public UserRole role { get; set; }
    }
}