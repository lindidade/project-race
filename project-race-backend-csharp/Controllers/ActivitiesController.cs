using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using project_race_backend_csharp.Models;

namespace project_race_backend_csharp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ActivitiesController : ControllerBase
    {
        private readonly ProjectRaceContext _context;

        public ActivitiesController(ProjectRaceContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateActivity([FromBody] ActivityModel model)
        {
            var user = await _context.Users.FindAsync(model.UserId);
            if (user == null)
                return NotFound(new { message = "Användaren hittades inte." });

            var newActivity = new Activity
            {
                UserId = model.UserId,
                Distance = model.Distance,
                Date = model.Date ?? DateOnly.FromDateTime(DateTime.Today),
                CreatedAt = DateTime.UtcNow,
                TeamId = user.TeamId
            };

            _context.Activities.Add(newActivity);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Aktiviteten har sparats!", activityId = newActivity.Id });
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserActivities(int userId)
        {
            var activities = await _context.Activities
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Date)
                .Select(a => new
                {
                    a.Id,
                    a.Distance,
                    a.Date,
                    a.CreatedAt
                })
                .ToListAsync();

            return Ok(activities);
        }
    }

    public class ActivityModel
    {
        public int UserId { get; set; }
        public decimal Distance { get; set; }
        public DateOnly? Date { get; set; }
    }
}