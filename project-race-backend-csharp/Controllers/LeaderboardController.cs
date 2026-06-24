using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace project_race_backend_csharp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaderboardController : ControllerBase
    {
        private readonly ProjectRaceContext _context;

        public LeaderboardController(ProjectRaceContext context)
        {
            _context = context;
        }

        // GET: api/leaderboard - Get top users by total distance
        [HttpGet]
        public async Task<IActionResult> GetLeaderboard([FromQuery] int userId)
        {
            // Get friend IDs for the current user
            var friendIds = await _context.Friends
                .Where(f => (f.UserId1 == userId || f.UserId2 == userId) && f.Status == "accepted")
                .Select(f => f.UserId1 == userId ? f.UserId2 : f.UserId1)
                .ToListAsync();

            // Include the user themselves
            friendIds.Add(userId);

            var leaderboard = await _context.Activities
                .Where(a => friendIds.Contains(a.UserId))
                .GroupBy(a => a.UserId)
                            .Select(g => new
                            {
                                UserId = g.Key,
                                TotalDistance = g.Sum(a => a.Distance)
                            })
                            .OrderByDescending(x => x.TotalDistance)
                            .Take(10)
                            .ToListAsync();

            // Get user names
            var userIds = leaderboard.Select(x => x.UserId).ToList();
            var users = await _context.Users
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Name })
                .ToListAsync();

            var result = leaderboard.Select(x => new
            {
                x.UserId,
                Name = users.FirstOrDefault(u => u.Id == x.UserId)?.Name ?? "Unknown",
                TotalDistance = x.TotalDistance,
                Rank = leaderboard.IndexOf(x) + 1
            });

            return Ok(result);
        }
    }
}