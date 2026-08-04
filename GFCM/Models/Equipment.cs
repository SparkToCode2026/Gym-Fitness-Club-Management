using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace GFCM.Models
{
    public class Equipment
    {
        [Key]
        [JsonIgnore]
        public int equipmentId { get; set; }
        public string equipmentName { get; set; }
        public int quantity { get; set; }
        public DateTime purchaseDate { get; set; }
        public enum maintenanceStatus
        {
            Operational, 
            UnderMaintenance, 
            Retired
        }

        //[1] Branch : [M] Equipment
        [ForeignKey("branch")]
        public int branchId { get; set; }

        //navigation
        [JsonIgnore]
        public Branch branch { get; set; } 

    }
}
