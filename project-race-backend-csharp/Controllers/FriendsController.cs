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

        // GET: api/friends/user/5 - Get all friends for a user
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetFriends(int userId)
        {
            var friends = await _context.Friends
                .Where(f => f.UserId1 == userId || f.UserId2 == userId)
                .Select(f => new
                {
                    f.Id,
                    f.Status,
                    FriendId = f.UserId1 == userId ? f.UserId2 : f.UserId1
                })
                .ToListAsync();

            return Ok(friends);
        }

        // POST: api/friends/request - Send friend request
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

        // PUT: api/friends/accept/5 - Accept friend request
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
    }

    public class FriendRequestModel
    {
        public int UserId1 { get; set; }
        public int UserId2 { get; set; }
    }
}