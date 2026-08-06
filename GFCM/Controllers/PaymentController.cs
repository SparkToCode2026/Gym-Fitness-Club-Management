using GFCM.Models;
using Microsoft.AspNetCore.Mvc;
using static System.Net.WebRequestMethods;

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

        [HttpPatch("updateStatus")]
        public IActionResult ConfirmOrFailAPayment(int id, PaymentStatus newStatus)
        {
            Payment p = context.payments.FirstOrDefault(p => p.paymentId == id);
            if(p == null)
            {
                return NotFound("Payment Not Found");
            }
            if (!Enum.IsDefined(typeof(PaymentStatus), newStatus))
            {
                return BadRequest("PaymentStatus must be Pending, Completed, Failed or Refunded.");
            }
            PaymentStatus oldStatus = p.paymentStatus;
            p.paymentStatus = newStatus;
            context.SaveChanges();
            return Ok($"PaymentStatus Updated successfuly from {oldStatus} to {newStatus}");            
        }

        [HttpDelete("remove")]
        public IActionResult RemoveAPayment(int id)
        {
            Payment p = context.payments.FirstOrDefault(p => p.paymentId == id);
            if(p == null)
            {
                return NotFound("Payment not found");
            }
            if (p.paymentStatus == PaymentStatus.Completed || p.paymentStatus == PaymentStatus.Refunded)
            {
                return Conflict("Completed payments cannot be deleted");
            }

            context.payments.Remove(p);
            context.SaveChanges();
            return Ok("Payment deleted successfully");

        }


    }
}
