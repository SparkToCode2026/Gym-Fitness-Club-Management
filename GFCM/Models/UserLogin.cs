using System.ComponentModel.DataAnnotations;

namespace GFCM.Models
{
    public class UserLogin
    {
        [Required]
        public string email { get; set; }
        [Required]
        public string password { get; set; }
    }
}
