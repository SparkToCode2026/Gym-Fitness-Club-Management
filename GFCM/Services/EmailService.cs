using GFCM.Models;
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

        // general templates, add new ones here so all the email content stays in one file
        // controllers only call these, they never build html themselves

        // fires from MembershipController case 09
        public void sendMembershipActivation(User user, MembershipPlan plan, DateTime endDate)
        {
            string body = $@"
            <div style='font-family: Arial, sans-serif;'>
            <h2>Welcome, {user.userName}!</h2>
            <p>Your <strong>{plan.planName}</strong> membership is now active.</p>
            <p>Valid until <strong>{endDate:dd MMM yyyy}</strong>.</p>
            <p style='color:#6c757d;font-size:13px;'>See you at the gym 💪</p>
            </div>";

            sendEmail(user.email, "Your membership is active", body);
        }

        // fires from ClassBookingController case 09
        public void sendClassBookingConfirmation(User user, ClassSchedule schedule)
        {
            string body = $@"
            <div style='font-family: Arial, sans-serif;'>
            </div>";

            sendEmail(user.email, "Your class booking is confirmed", body);
        }

        // could fire from MembershipController case 11 when status goes to Cancelled
        public void sendMembershipCancelled(User user, MembershipPlan plan)
        {
            string body = $@"
            <div style='font-family: Arial, sans-serif;'>
            </div>";

            sendEmail(user.email, "Your membership has been cancelled", body);
        }

        // could be driven by MembershipController case 15, getExpiring already returns the list
        public void sendRenewalReminder(User user, DateTime endDate)
        {
            string body = $@"
            <div style='font-family: Arial, sans-serif;'>
            </div>";

            sendEmail(user.email, "Your membership expires soon", body);
        }

        // could fire from PaymentController case 11 when a payment moves to Completed
        public void sendPaymentReceipt(User user, Payment payment)
        {
            string body = $@"
            <div style='font-family: Arial, sans-serif;'>
            </div>";

            sendEmail(user.email, "Payment received", body);
        }
    }
}