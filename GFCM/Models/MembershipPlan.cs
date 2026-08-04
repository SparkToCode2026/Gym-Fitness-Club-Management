using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GFCM.Models
{
    public class MembershipPlan
    {
        // primary key, hidden so the client never sends it
        [Key]
        [JsonIgnore]
        public int membershipPlanId { get; set; }

        // the tier name, like "premium 3 months"
        [Required]
        public string planName { get; set; }

        public string planDescription { get; set; }

        // how many days a membership on this plan lasts
        // endDate gets calculated from this, so it must be > 0
        public int durationInDays { get; set; }

        // decimal not double, maxPrice case is in decimal
        [Column(TypeName = "decimal(18,2)")]
        public decimal planPrice { get; set; }

        public int maxClassesPerMonth { get; set; }

        // false = retired, this is what soft delete flips instead of removing the row
        public bool isActive { get; set; }

        // every membership sold on this plan
        // points at the membershipPlan property inside Membership
        [InverseProperty("membershipPlan")]
        [JsonIgnore]
        public List<Membership> memberships { get; set; }
    }
}