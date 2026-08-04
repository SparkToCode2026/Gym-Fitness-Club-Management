using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GFCM.Models
{
    public class Payment
    {
        [Key]
        public int PaymentId { get; set; }
        public double PaymentAmount { get; set; }
        public DateTime PaymentDate { get; set; }
        public enum PaymentMethod
        {
            Cash,
            CreditCard,
            DebitCard,
            BankTransfer,
        }
        public enum PaymentStatus
        {
            Pending,
            Paid,
            Failed,
            Refunded
        }

        //[1] User : [M] Payment
        [ForeignKey("_user")]
        public int UserId { get; set; }

        //[1] Membership : [M] Payment
        [ForeignKey("_membership")]
        public int MembershipId { get; set; }


        public User? _user {  get; set; }
        public Membership? _membership {  get; set; }
    }
}
