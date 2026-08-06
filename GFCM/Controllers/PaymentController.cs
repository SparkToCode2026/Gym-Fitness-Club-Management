using GFCM.Models;
using Microsoft.AspNetCore.Mvc;

namespace GFCM.Controllers
{
    public class PaymentController : ControllerBase
    {
        private ProjectContext context;

        public PaymentController(ProjectContext _context)
        {
            context = _context;
        }

        [HttpPost("add")]
        public IActionResult AddRecordPayment(Payment p)
        {
            var userid = context.users.FirstOrDefault(u => u.userId == p.userId );
            if(userid == null)
            {
                return BadRequest("User not found");
            }
            if(p.membershipId.HasValue)
            {
                var mambershipid = context.memberships.FirstOrDefault(m => m.membershipId == p.membershipId.Value);
                if(mambershipid == null)
                {
                    return BadRequest("Membership not found");
                }
            }

            if(p.amount <= 0)
            {
                return BadRequest("Amout must be more than zero");
            }
            p.paymentDate = DateTime.Now;
            p.paymentStatus = PaymentStatus.Pending;
            context.payments.Add(p);
            context.SaveChanges();
            return Ok(new
            {
                paymentId = p.paymentId
            });
        }

        [HttpPut("update")]
        public IActionResult CorrectPendingPayment(int id, Payment p)
        {
             var payment = context.payments.FirstOrDefault(p => p.paymentId == id);
             if(payment == null)
             {
                return NotFound();
             }
             if(payment.paymentStatus == PaymentStatus.Completed || payment.paymentStatus == PaymentStatus.Refunded)
             {
                return Conflict("Completed payments cannot be edited");
             }
            else
            {
                payment.amount = p.amount;
                payment.paymentMethod = p.paymentMethod;
                context.SaveChanges();
                return Ok("Payment Updated Successfuly");
            }
             
        }





    }
}
