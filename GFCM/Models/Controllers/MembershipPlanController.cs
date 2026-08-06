using GFCM.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GFCM.Controllers
{
    // TODO (self-study): [Authorize]
    [ApiController]
    [Route("membershipplan")]
    public class MembershipPlanController : ControllerBase
    {
        private ProjectContext context;

        public MembershipPlanController(ProjectContext context)
        {
            this.context = context;
        }

        // case 01 - add a plan
        [HttpPost("add")]
        public IActionResult add(MembershipPlan plan)
        {
            if (plan.durationInDays <= 0)
                return BadRequest("durationInDays must be greater than zero");

            if (plan.planPrice < 0)
                return BadRequest("planPrice cannot be negative");

            // a new plan is always on sale, whatever the client sent
            plan.isActive = true;

            context.membershipPlans.Add(plan);
            context.SaveChanges();

            return Ok(new { message = "Plan added", membershipPlanId = plan.membershipPlanId });
        }

        // case 02 - update a plan
        [HttpPut("update")]
        public IActionResult update(int membershipPlanId, MembershipPlan updatedPlan)
        {
            MembershipPlan plan = context.membershipPlans
                .FirstOrDefault(p => p.membershipPlanId == membershipPlanId);

            if (plan == null)
                return NotFound("Plan not found");

            // durationInDays is not copied, memberships already sold used the old value
            plan.planDescription = updatedPlan.planDescription;
            plan.planPrice = updatedPlan.planPrice;

            context.SaveChanges();

            return Ok(new { message = "Plan updated", plan.membershipPlanId, plan.planName });
        }

        // case 03 - activate or retire a plan
        [HttpPatch("updateStatus")]
        public IActionResult updateStatus(int membershipPlanId, bool isActive)
        {
            MembershipPlan plan = context.membershipPlans
                .FirstOrDefault(p => p.membershipPlanId == membershipPlanId);

            if (plan == null)
                return NotFound("Plan not found");

            // memberships already sold keep running, only the plan itself is toggled
            plan.isActive = isActive;
            context.SaveChanges();

            return Ok(new
            {
                message = isActive ? "Plan is now active" : "Plan is now retired",
                plan.membershipPlanId,
                plan.planName
            });
        }

        // case 04 - remove a plan (soft delete)
        [HttpDelete("remove")]
        public IActionResult remove(int membershipPlanId)
        {
            MembershipPlan plan = context.membershipPlans
                .FirstOrDefault(p => p.membershipPlanId == membershipPlanId);

            if (plan == null)
                return NotFound("Plan not found");

            // soft delete, a hard delete would break membership history
            plan.isActive = false;
            context.SaveChanges();

            return Ok(new { message = "Plan discontinued", plan.membershipPlanId, plan.planName });
        }

        // case 05 - get all plans with subscriber count
        [HttpGet("getAll")]
        public IActionResult getAll(bool activeOnly = false)
        {
            var query = context.membershipPlans.Include(p => p.memberships).AsQueryable();

            if (activeOnly)
                query = query.Where(p => p.isActive);

            // the collection is projected down to a count, not returned whole
            var plans = query
                .Select(p => new
                {
                    p.membershipPlanId,
                    p.planName,
                    p.planDescription,
                    p.durationInDays,
                    p.planPrice,
                    p.maxClassesPerMonth,
                    p.isActive,
                    subscriberCount = p.memberships.Count()
                })
                .ToList();

            return Ok(new { count = plans.Count, plans });
        }

        // case 06 - get a plan
        [HttpGet("get")]
        public IActionResult get(int membershipPlanId)
        {
            MembershipPlan plan = context.membershipPlans
                .FirstOrDefault(p => p.membershipPlanId == membershipPlanId);

            if (plan == null)
                return NotFound("Plan not found");

            // retired plans stay readable by id
            return Ok(plan);
        }

        // case 07 - get plans by price
        [HttpGet("getByPrice")]
        public IActionResult getByPrice(decimal maxPrice)
        {
            // filtering happens on the query, before ToList
            var plans = context.membershipPlans
                .Where(p => p.isActive && p.planPrice <= maxPrice)
                .OrderBy(p => p.planPrice)
                .ToList()
                .Select(p => new
                {
                    p.membershipPlanId,
                    p.planName,
                    p.durationInDays,
                    planPrice = p.planPrice.ToString("F2")
                })
                .ToList();

            return Ok(new { count = plans.Count, maxPrice = maxPrice.ToString("F2"), plans });
        }

        // case 08 - most popular plans
        [HttpGet("getPopular")]
        public IActionResult getPopular()
        {
            var popular = context.memberships
                .GroupBy(m => m.membershipPlanId)
                .Select(g => new { membershipPlanId = g.Key, subscribers = g.Count() })
                .OrderByDescending(x => x.subscribers)
                .ToList();

            List<MembershipPlan> plans = context.membershipPlans.ToList();

            // joined back to the plans so the response carries names, not bare ids
            var result = popular
                .Select(x => new
                {
                    x.membershipPlanId,
                    planName = plans.FirstOrDefault(p => p.membershipPlanId == x.membershipPlanId).planName,
                    x.subscribers
                })
                .ToList();

            return Ok(new { count = result.Count, plans = result });
        }
    }
}