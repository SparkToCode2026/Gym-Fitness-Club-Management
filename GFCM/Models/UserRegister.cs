namespace GFCM.Models
{
    public class UserRegister
    {
        public string userName { get; set; }
        public string email { get; set; }
        public string password { get; set; }
        public enum role
        {
            Admin,
            Trainer,
            Member
        }
    }
}
