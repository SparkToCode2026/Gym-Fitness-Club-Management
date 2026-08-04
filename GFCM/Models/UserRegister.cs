using System.Text.Json.Serialization;

namespace GFCM.Models
{
    public class UserRegister
    {
        public string userName { get; set; }
        public string email { get; set; }
        public string password { get; set; }

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public UserRole role { get; set; }
    }
}