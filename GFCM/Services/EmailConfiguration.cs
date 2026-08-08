namespace GFCM.Services
{
    // not an entity, no table, no DbSet
    // just holds the smtp values read from appsettings.json
    public class EmailConfiguration
    {
        public string From { get; set; }
        public string SenderName { get; set; }
        public string SmtpServer { get; set; }
        public int Port { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
    }
}