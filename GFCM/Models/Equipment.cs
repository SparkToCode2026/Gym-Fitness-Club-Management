using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GFCM.Models
{
    public class Equipment
    {
        [Key]
        public int EquipmentId { get; set; }
        public string EquipmentName { get; set; }
        public int EquipmentQuantity { get; set; }
        public DateTime EquipmentPurchaseDate { get; set; }
        public enum EquipmentMaintenanceStatus
        {
            Available,
            InUse,
            UnderMaintenance,
            OutOfService
        }

        //[1] Branch : [M] Equipment
        [ForeignKey("_branch")]
        public int BranchId { get; set; }

        //navigation
        //? helps on response purpus
        public Branch? _branch { get; set; } 



    }
}
