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

        [Column(TypeName = "decimal(18,2)")]
        public decimal amount { get; set; }

        public DateTime paymentDate { get; set; }

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public PaymentMethod paymentMethod { get; set; }

        [JsonConverter(typeof(JsonStringEnumConverter))]
        public PaymentStatus paymentStatus { get; set; }

        //[1] User : [M] Payment
        [ForeignKey("user")]
        public int userId { get; set; }

        [JsonIgnore]
        public User user { get; set; }

        //[1] Membership : [M] Payment
        [ForeignKey("membership")]
        public int? membershipId { get; set; }

        [JsonIgnore]
        public Membership? membership { get; set; }
    }

    public enum PaymentMethod
    {
        Card,
        Cash,
        Transfer
    }

    public enum PaymentStatus
    {
        Pending,
        Completed,
        Failed,
        Refunded
    }
}