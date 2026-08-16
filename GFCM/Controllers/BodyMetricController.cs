using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GFCM.Models;
using Microsoft.AspNetCore.Authorization;

namespace GFCM.Controllers
{
    [ApiController]
    [Route("bodymetric")]
    [Authorize]
    public class BodyMetricController : ControllerBase
    {
        private readonly ProjectContext context;

        public BodyMetricController(ProjectContext context)
        {
            this.context = context;
        }

        [HttpPost("add")]
        public IActionResult Add([FromBody] BodyMetric newMetric)
        {
            bool userExists = context.users.Any(u => u.userId == newMetric.userId);
            if (!userExists)
                return BadRequest("User not found");

            if (newMetric.weightKg <= 0 || newMetric.heightCm <= 0)
                return BadRequest("weightKg and heightCm must be greater than zero");

            if (newMetric.bodyFatPercentage.HasValue &&
                (newMetric.bodyFatPercentage < 0 || newMetric.bodyFatPercentage > 100))
                return BadRequest("bodyFatPercentage must be between 0 and 100");

            newMetric.metricDate = DateTime.Now;

            context.bodyMetrics.Add(newMetric);
            context.SaveChanges();

            return Ok(new { message = "Body metric logged", id = newMetric.bodyMetricId });
        }

        [HttpPut("update")]
        public IActionResult Update(int bodyMetricId, [FromBody] BodyMetric updated)
        {
            var metric = context.bodyMetrics.FirstOrDefault(b => b.bodyMetricId == bodyMetricId);
            if (metric == null)
                return NotFound("Body metric not found");

            if (updated.weightKg <= 0 || updated.heightCm <= 0)
                return BadRequest("weightKg and heightCm must be greater than zero");

            if (updated.bodyFatPercentage.HasValue &&
                (updated.bodyFatPercentage < 0 || updated.bodyFatPercentage > 100))
                return BadRequest("bodyFatPercentage must be between 0 and 100");

            metric.weightKg = updated.weightKg;
            metric.heightCm = updated.heightCm;
            metric.bodyFatPercentage = updated.bodyFatPercentage;
            metric.muscleMassKg = updated.muscleMassKg;

            context.SaveChanges();
            return Ok("Body metric updated");
        }

        [HttpPatch("updateWeight")]
        public IActionResult UpdateWeight(int bodyMetricId, double newWeightKg)
        {
            var metric = context.bodyMetrics.FirstOrDefault(b => b.bodyMetricId == bodyMetricId);
            if (metric == null)
                return NotFound("Body metric not found");

            if (newWeightKg <= 0)
                return BadRequest("newWeightKg must be greater than zero");

            double oldWeight = metric.weightKg;
            metric.weightKg = newWeightKg;
            context.SaveChanges();

            return Ok(new { message = "Weight updated", oldWeight, newWeight = newWeightKg });
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("remove")]
        public IActionResult Remove(int bodyMetricId)
        {
            var metric = context.bodyMetrics.FirstOrDefault(b => b.bodyMetricId == bodyMetricId);
            if (metric == null)
                return NotFound("Body metric not found");

            context.bodyMetrics.Remove(metric);
            context.SaveChanges();

            return Ok("Body metric deleted");
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var metrics = context.bodyMetrics
                .Include(b => b.user)
                .OrderByDescending(b => b.metricDate)
                .Select(b => new
                {
                    b.bodyMetricId,
                    b.userId,
                    memberName = b.user.userName,
                    b.metricDate,
                    b.weightKg,
                    b.heightCm,
                    b.bodyFatPercentage,
                    b.muscleMassKg
                })
                .ToList();

            return Ok(metrics);
        }

        [HttpGet("get")]
        public IActionResult Get(int bodyMetricId)
        {
            var metric = context.bodyMetrics
                .Include(b => b.user)
                .Where(b => b.bodyMetricId == bodyMetricId)
                .Select(b => new
                {
                    b.bodyMetricId,
                    b.userId,
                    memberName = b.user.userName,
                    b.metricDate,
                    b.weightKg,
                    b.heightCm,
                    b.bodyFatPercentage,
                    b.muscleMassKg
                })
                .FirstOrDefault();

            if (metric == null)
                return NotFound("Body metric not found");

            return Ok(metric);
        }

        [HttpGet("getByUser")]
        public IActionResult GetByUser(int userId, DateTime? from, DateTime? to)
        {
            var query = context.bodyMetrics.Where(b => b.userId == userId);

            if (from.HasValue)
                query = query.Where(b => b.metricDate >= from.Value);

            if (to.HasValue)
                query = query.Where(b => b.metricDate <= to.Value);

            var result = query
                .OrderBy(b => b.metricDate)
                .ToList();

            return Ok(new { count = result.Count, metrics = result });
        }

        [HttpGet("getSummary")]
        public IActionResult GetSummary(int userId)
        {
            var summary = context.bodyMetrics
                .Where(b => b.userId == userId)
                .GroupBy(b => b.userId)
                .Select(g => new
                {
                    userId = g.Key,
                    entries = g.Count(),
                    averageWeight = Math.Round(g.Average(x => x.weightKg), 1),
                    lightestKg = g.Min(x => x.weightKg),
                    heaviestKg = g.Max(x => x.weightKg)
                })
                .FirstOrDefault();

            if (summary == null)
                return NotFound("No measurements found for this member");

            return Ok(summary);
        }
    }
}

 
  
    
    
