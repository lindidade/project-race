using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using project_race_backend_csharp.Models;

namespace project_race_backend_csharp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FriendsController : ControllerBase
    {
        private readonly ProjectRaceContext _context;

        public FriendsController(ProjectRaceContext context)
        {
            _context = context;
        }

       [HttpGet("user/{userId}")]

public async Task<IActionResult> GetFriends(int userId)
{
    var friends = await _context.Friends
        .Where(f => (f.UserId1 == userId || f.UserId2 == userId))
        .ToListAsync();

    var result = new List<object>();
    foreach (var f in friends)
    {
        var friendId = f.UserId1 == userId ? f.UserId2 : f.UserId1;
        var friendUser = await _context.Users.FindAsync(friendId);
        result.Add(new
        {
            f.Id,
            f.Status,
            FriendId = friendId,
            FriendName = friendUser?.Name ?? "Unknown"
        });
    }

    return Ok(result);
}

        [HttpPost("request")]
        public async Task<IActionResult> SendRequest([FromBody] FriendRequestModel model)
        {
            var existingFriend = await _context.Friends
                .AnyAsync(f => 
                    (f.UserId1 == model.UserId1 && f.UserId2 == model.UserId2) ||
                    (f.UserId1 == model.UserId2 && f.UserId2 == model.UserId1));

            if (existingFriend)
                return BadRequest(new { message = "Friend request already exists." });

            var friend = new Friend
            {
                UserId1 = model.UserId1,
                UserId2 = model.UserId2,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Friends.Add(friend);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Friend request sent!" });
        }

        [HttpPut("accept/{friendId}")]
        public async Task<IActionResult> AcceptRequest(int friendId)
        {
            var friend = await _context.Friends.FindAsync(friendId);
            if (friend == null)
                return NotFound(new { message = "Friend request not found." });

            friend.Status = "accepted";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Friend request accepted!" });
        }

        [HttpGet("pending/{userId}")]
        public async Task<IActionResult> GetPendingRequests(int userId)
        {
            var pending = await _context.Friends
                .Where(f => f.UserId2 == userId && f.Status == "pending")
                .Join(_context.Users,
                    f => f.UserId1,
                    u => u.Id,
                    (f, u) => new
                    {
                        f.Id,
                        f.UserId1,
                        SenderName = u.Name,
                        f.Status,
                        f.CreatedAt
                    })
                .ToListAsync();

            return Ok(pending);
        }
    }

    public class FriendRequestModel
    {
        public int UserId1 { get; set; }
        public int UserId2 { get; set; }
    }
}