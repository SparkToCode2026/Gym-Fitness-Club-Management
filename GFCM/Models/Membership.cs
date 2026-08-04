using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GFCM.Models
{
    public class Membership
    {
        [Key]
        [JsonIgnore]
        public int membershipId { get; set; }

        // who the subscription belongs to
        [ForeignKey("user")]
        public int userId { get; set; }

        [JsonIgnore]
        public User user { get; set; }

        // which plan was bought
        [ForeignKey("membershipPlan")]
        public int membershipPlanId { get; set; }

        [JsonIgnore]
        public MembershipPlan membershipPlan { get; set; }

        // set to DateTime.Now when enrolling, not taken from the client
        public DateTime startDate { get; set; }

        // startDate + the plan's durationInDays, always calculated in the controller
        public DateTime endDate { get; set; }

        // only these three states, the enum stops a typo ever reaching the database
        // JsonStringEnumConverter makes it show as "Active" in swagger instead of 0
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public MembershipStatus membershipStatus { get; set; }

        public DateTime createdAt { get; set; }
    }

    // declared next to the class, not inside it, so controllers can just write MembershipStatus.Active
    public enum MembershipStatus
    {
        Active,
        Expired,
        Cancelled
    }
}