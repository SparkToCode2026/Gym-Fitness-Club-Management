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
    }
}
