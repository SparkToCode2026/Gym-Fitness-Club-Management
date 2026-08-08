using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MimeKit.Text;

namespace GFCM.Services
{
    public class EmailService
    {
        private EmailConfiguration config;

        public EmailService(EmailConfiguration config)
        {
            this.config = config;
        }

        // one method the whole project calls, body is html
        public void sendEmail(string to, string subject, string htmlBody)
        {
            
            try
            {
                MimeMessage email = new MimeMessage();

                // two arguments, display name then address
                // the single argument version was removed from mailkit
                email.From.Add(new MailboxAddress(config.SenderName, config.From));
                email.To.Add(MailboxAddress.Parse(to));
                email.Subject = subject;
                email.Body = new TextPart(TextFormat.Html) { Text = htmlBody };

                using var smtp = new SmtpClient();
                smtp.Connect(config.SmtpServer, config.Port, SecureSocketOptions.StartTls);
                smtp.Authenticate(config.UserName, config.Password);
                smtp.Send(email);
                smtp.Disconnect(true);
            }
            catch (Exception ex)
            {
                // never let a mail failure break the request that triggered it
                // the membership is already saved at this point
                Console.WriteLine("Email failed: " + ex.Message);
            }
        }
    }
}