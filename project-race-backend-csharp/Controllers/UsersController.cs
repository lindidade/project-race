using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace project_race_backend_csharp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ProjectRaceContext _context;

        public UsersController(ProjectRaceContext context)
        {
            _context = context;
        }

        // GET: api/users/search?email=test@test.com
        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string email)
        {
            var users = await _context.Users
                .Where(u => u.Email.Contains(email))
                .Select(u => new
                {
                    u.Id,
                    u.Name,
                    u.Email
                })
                .ToListAsync();

            return Ok(users);
        }
    }
}