using GFCM.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata.Ecma335;

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
        public IActionResult AddEquipment(Equipment e)
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

            e.maintenanceStatus = PaymentMethod.Operational;
            context.equipment.Add(e);
            context.SaveChanges();
            return Ok(e.equipmentId);
        }
         
        [HttpPut("update")]
        public IActionResult UpdateAnEquipmentRecord(int id, Equipment newE )
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
        public IActionResult FlagEquipmentMaintenance(int id, PaymentMethod newStatus)
        {
            Equipment e = context.equipment.FirstOrDefault(e => e.equipmentId == id);

            if (e == null)
            {
                return NotFound("Equipment Not Found");
            }
            if (!Enum.IsDefined(typeof(PaymentMethod), newStatus))
            {
                return BadRequest("EquipmentStatus must be Operational, UnderMaintenance or Retired.");
            }

            PaymentMethod oldStatus = e.maintenanceStatus;
            e.maintenanceStatus = newStatus;
            context.SaveChanges();
            return Ok($"Maintenance Status Updated successfuly from {oldStatus} to {newStatus}");

        }

        [HttpDelete("remove")]
        public IActionResult DecommissionEquipment(int id) 
        {
            Equipment e = context.equipment.FirstOrDefault(e => e.equipmentId == id);
            if (e == null)
            {
                return NotFound("Equipment not found");
            }
            e.maintenanceStatus = PaymentMethod.Retired;
            context.SaveChanges();
            return Ok("Successfuly changed the maintenance status");
        }

        [HttpGet("getAll")]
        public IActionResult GetAllEquipment() 
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
        public IActionResult GetEquipment(int id)
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

        [HttpGet("getByBranch")]
        public IActionResult FilterEquipment(int? branchId, PaymentMethod? status)
        {
            var query = context.equipment.AsQueryable();

            if (branchId.HasValue && status.HasValue)
            {
                query = query.Where(e => e.branchId == branchId.Value && e.maintenanceStatus == status.Value);
            }
        
            var e = query.Include(e => e.branch).Select(e => new
            {
                e.equipmentId,
                e.equipmentName,
                e.quantity,
                e.purchaseDate,
                e.maintenanceStatus,
                branchName = e.branch.branchName
            }).ToList();

            return Ok(new
            {
                Count = e.Count,
                Data = e
            });
        }

        [HttpGet("countByStatus")]
        public IActionResult InventoryBreakdownbyStatus()
        {
            var breakdown = context.equipment
            .GroupBy(e => e.maintenanceStatus)
            .Select(g => new {
                status = g.Key,
                records = g.Count(),
                totalUnits = g.Sum(e => e.quantity)
        }).ToList();
            return Ok(breakdown);
        }
    }
}
