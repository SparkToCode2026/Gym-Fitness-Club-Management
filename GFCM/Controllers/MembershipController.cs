using GFCM.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GFCM.Controllers
{
    // TODO (self-study): [Authorize]
    [ApiController]
    [Route("membership")]
    public class MembershipController : ControllerBase
    {
        private ProjectContext context;

        public MembershipController(ProjectContext context)
        {
            this.context = context;
        }

        // case 09 - enrol a user in a plan
        [HttpPost("add")]
        public IActionResult add(Membership membership)
        {
            User user = context.users.FirstOrDefault(u => u.userId == membership.userId);
            if (user == null)
                return BadRequest("User not found");

            MembershipPlan plan = context.membershipPlans
                .FirstOrDefault(p => p.membershipPlanId == membership.membershipPlanId);

            if (plan == null)
                return BadRequest("Plan not found");

            if (plan.isActive == false)
                return BadRequest("Plan is retired and cannot be sold");

            // endDate always comes from the plan duration, never from the client
            membership.startDate = DateTime.Now;
            membership.endDate = membership.startDate.AddDays(plan.durationInDays);
            membership.membershipStatus = MembershipStatus.Active;
            membership.createdAt = DateTime.Now;

            context.memberships.Add(membership);
            context.SaveChanges();

            // TODO (self-study): activation email fires here IF the team chose enrolment over registration

            return Ok(new
            {
                message = "Membership created",
                membership.membershipId,
                membership.endDate
            });
        }

        // case 10 - renew a membership
        [HttpPut("update")]
        public IActionResult update(int membershipId, int additionalDays)
        {
            if (additionalDays <= 0)
                return BadRequest("additionalDays must be greater than zero");

            Membership membership = context.memberships
                .FirstOrDefault(m => m.membershipId == membershipId);

            if (membership == null)
                return NotFound("Membership not found");

            if (membership.membershipStatus == MembershipStatus.Cancelled)
                return Conflict("A cancelled membership cannot be renewed");

            // extended from the existing endDate so early renewers keep their remaining days
            membership.endDate = membership.endDate.AddDays(additionalDays);

            if (membership.membershipStatus == MembershipStatus.Expired)
                membership.membershipStatus = MembershipStatus.Active;

            context.SaveChanges();

            return Ok(new
            {
                message = "Membership renewed",
                membership.membershipId,
                membership.endDate,
                membership.membershipStatus
            });
        }

        // case 11 - change membership status
        [HttpPatch("updateStatus")]
        public IActionResult updateStatus(int membershipId, string newStatus)
        {
            Membership membership = context.memberships
                .FirstOrDefault(m => m.membershipId == membershipId);

            if (membership == null)
                return NotFound("Membership not found");

            // an unrecognised status is rejected, never stored
            MembershipStatus parsed;
            if (!Enum.TryParse<MembershipStatus>(newStatus, true, out parsed))
                return BadRequest("Status must be Active, Expired or Cancelled");

            membership.membershipStatus = parsed;
            context.SaveChanges();

            return Ok(new
            {
                message = "Status updated",
                membership.membershipId,
                membership.membershipStatus
            });
        }

        // case 12 - remove a membership
        [HttpDelete("remove")]
        public IActionResult remove(int membershipId)
        {
            Membership membership = context.memberships
                .FirstOrDefault(m => m.membershipId == membershipId);

            if (membership == null)
                return NotFound("Membership not found");

            // cross table check against dev 4's payments, Any not a count
            bool hasPayments = context.payments.Any(p => p.membershipId == membershipId);

            if (hasPayments)
                return Conflict("Membership has payment history, cancel it instead");

            context.memberships.Remove(membership);
            context.SaveChanges();

            return Ok(new { message = "Membership removed", membershipId });
        }

        // case 13 - get all memberships
        [HttpGet("getAll")]
        public IActionResult getAll()
        {
            // both includes needed, and the select flattens the names in
            var memberships = context.memberships
                .Include(m => m.user)
                .Include(m => m.membershipPlan)
                .Select(m => new
                {
                    m.membershipId,
                    m.startDate,
                    m.endDate,
                    m.membershipStatus,
                    m.createdAt,
                    memberName = m.user.userName,
                    planName = m.membershipPlan.planName
                })
                .ToList();

            return Ok(new { count = memberships.Count, memberships });
        }

        // case 14 - get a membership
        [HttpGet("get")]
        public IActionResult get(int membershipId)
        {
            // FirstOrDefault on the query, Find does not support Include
            var membership = context.memberships
                .Include(m => m.user)
                .Include(m => m.membershipPlan)
                .Where(m => m.membershipId == membershipId)
                .Select(m => new
                {
                    m.membershipId,
                    m.startDate,
                    m.endDate,
                    m.membershipStatus,
                    m.createdAt,
                    memberName = m.user.userName,
                    planName = m.membershipPlan.planName
                })
                .FirstOrDefault();

            if (membership == null)
                return NotFound("Membership not found");

            return Ok(membership);
        }

        // case 15 - memberships expiring soon
        [HttpGet("getExpiring")]
        public IActionResult getExpiring(int days = 7)
        {
            DateTime cutoff = DateTime.Now.AddDays(days);

            // both conditions needed, date alone would sweep in cancelled rows
            var expiring = context.memberships
                .Include(m => m.user)
                .Where(m => m.membershipStatus == MembershipStatus.Active && m.endDate <= cutoff)
                .OrderBy(m => m.endDate)
                .Select(m => new
                {
                    m.membershipId,
                    m.endDate,
                    memberName = m.user.userName
                })
                .ToList();

            return Ok(new { count = expiring.Count, days, expiring });
        }

        // case 16 - count memberships by plan
        [HttpGet("countByPlan")]
        public IActionResult countByPlan()
        {
            // the active count inside the group is what makes this useful
            var counts = context.memberships
                .GroupBy(m => m.membershipPlanId)
                .Select(g => new
                {
                    membershipPlanId = g.Key,
                    total = g.Count(),
                    active = g.Count(m => m.membershipStatus == MembershipStatus.Active)
                })
                .ToList();

            return Ok(new { count = counts.Count, counts });
        }
    }
}