using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GFCM.Models
{
    public class Payment
    {
        [Key]
        [JsonIgnore]
        public int paymentId { get; set; }
        public double amount { get; set; }
        public DateTime paymentDate { get; set; }
        public enum paymentMethod
        {
            Card, 
            Cash, 
            Transfer
        }
        public enum paymentStatus
        {
            Pending,
            Completed,
            Failed,
            Refunded
        }

        //[1] User : [M] Payment
        [ForeignKey("user")]
        public int userId { get; set; }

        //[1] Membership : [M] Payment
        [ForeignKey("membership")]
        public int? membershipId { get; set; }

        [JsonIgnore]
        public User user {  get; set; }
        [JsonIgnore]
        public Membership? membership {  get; set; }
    }
}
