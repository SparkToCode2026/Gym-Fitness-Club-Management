using GFCM.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GFCM.Controllers
{
    public class EquipmentController : ControllerBase

    {
        private ProjectContext context;

        public EquipmentController(ProjectContext _context)
        {
            context = _context;
        }

        [HttpPost("add")]
        public IActionResult add(Equipment e)
        {
            //Verify the branch exists
            var branch = context.branches.FirstOrDefault(b => b.branchId == e.branchId);

            if(branch == null)
            {
                return BadRequest("Branch not found");
            }

            if (e.quantity <= 0)
            {
                return BadRequest("Quantity must be more than 0");
            }

            if (e.purchaseDate > DateTime.Now)
            {
                return BadRequest("Rejected. purchase date can not be in future");
            }

            e.maintenanceStatus = EquipmentStatus.Operational;
            context.equipment.Add(e);
            context.SaveChanges();
            return Ok(e.equipmentId);
        }
         
        [HttpPut("update")]
        public IActionResult update(int id, Equipment newE )
        {
            Equipment e = context.equipment.FirstOrDefault(e => e.equipmentId == id);

            if(e == null)
            {
                return NotFound("Equipment Not Found");
            }
            else
            {

                if(newE.quantity < 0)
                {
                    return BadRequest("Quantity with nigative value. Rejected");
                }
                e.equipmentName = newE.equipmentName;
                e.quantity = newE.quantity;
                context.SaveChanges();
                return Ok("Equipment Updated successfuly");
            }
        }

        [HttpPatch("updateStatus")]
        public IActionResult updateStatus(int id, string newStatus)
        {
            Equipment e = context.equipment.FirstOrDefault(e => e.equipmentId == id);

            //convert string to enum
            if (e == null)
            {
                return NotFound("Equipment Not Found");
            }
            if (!Enum.TryParse<EquipmentStatus>(newStatus, true, out EquipmentStatus presentStatus))
            {
                return BadRequest("EquipmentStatus must be Operational, UnderMaintenance or Retired");
            }
            EquipmentStatus oldStatus = e.maintenanceStatus;
            e.maintenanceStatus = presentStatus;
            context.SaveChanges();
            return Ok($"Maintenance Status Updated successfuly from {oldStatus} to {presentStatus}");

        }

        [HttpDelete("remove")]
        public IActionResult remove(int id) 
        {
            Equipment e = context.equipment.FirstOrDefault(e => e.equipmentId == id);
            if (e == null)
            {
                return NotFound("Equipment not found");
            }
            e.maintenanceStatus = EquipmentStatus.Retired;
            context.SaveChanges();
            return Ok("Successfuly changed the maintenance status");
        }

        [HttpGet("getAll")]
        public IActionResult getAll() 
        { 
            var equipment = context.equipment.
                Include(e => e.branch).
                OrderBy(e => e.branch.branchName).
                ThenBy(e => e.equipmentName).
                Select(e => new 
                {               
                e.equipmentId, 
                e.equipmentName, 
                e.quantity, 
                e.purchaseDate, 
                e.maintenanceStatus, 
                branchName = e.branch.branchName 
                }).ToList();
            return Ok(equipment);
        }

        [HttpGet("get")]
        public IActionResult get(int id)
        {
                var e = context.equipment.Include(e => e.branch).               
                Select(e => new
                {
                    e.equipmentId,
                    e.equipmentName,
                    e.quantity,
                    e.purchaseDate,
                    e.maintenanceStatus,
                    branchName = e.branch.branchName
                }).FirstOrDefault(e => e.equipmentId == id); 

                if (e == null)
                {
                    return NotFound("Equipment not found");
                }
                return Ok(e);
                
        }



    }
}
