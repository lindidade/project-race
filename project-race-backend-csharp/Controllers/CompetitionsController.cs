using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using project_race_backend_csharp.Models;

namespace project_race_backend_csharp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompetitionsController : ControllerBase
    {
        private readonly ProjectRaceContext _context;

        public CompetitionsController(ProjectRaceContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateCompetition([FromBody] CreateCompetitionModel model)
        {
            var competition = new Competition
            {
                Name = model.Name,
                StartDate = model.StartDate != null ? DateOnly.Parse(model.StartDate) : null,
                EndDate = model.EndDate != null ? DateOnly.Parse(model.EndDate) : null,
                CreatedBy = model.CreatedBy,
                CreatedAt = DateTime.UtcNow
            };

            _context.Competitions.Add(competition);
            await _context.SaveChangesAsync();

            var member = new CompetitionMember
            {
                CompetitionId = competition.Id,
                UserId = model.CreatedBy,
                Role = "super_admin",
                JoinedAt = DateTime.UtcNow
            };

            _context.CompetitionMembers.Add(member);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Competition created!", competitionId = competition.Id });
        }

        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserCompetitions(int userId)
        {
            var competitions = await _context.CompetitionMembers
                .Where(cm => cm.UserId == userId)
                .Join(_context.Competitions,
                    cm => cm.CompetitionId,
                    c => c.Id,
                    (cm, c) => new
                    {
                        c.Id,
                        c.Name,
                        c.StartDate,
                        c.EndDate,
                        c.CreatedBy,
                        cm.JoinedAt
                    })
                .ToListAsync();

            return Ok(competitions);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCompetition(int id)
        {
            var competition = await _context.Competitions
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.Name,
                    c.StartDate,
                    c.EndDate,
                    c.CreatedBy
                })
                .FirstOrDefaultAsync();

            if (competition == null)
                return NotFound(new { message = "Competition not found." });

            return Ok(competition);
        }

        [HttpPost("invite")]
        public async Task<IActionResult> InviteToCompetition([FromBody] InviteModel model)
        {
            try
            {
                var exists = await _context.CompetitionMembers
                    .AnyAsync(cm => cm.CompetitionId == model.CompetitionId && cm.UserId == model.UserId);

                if (exists)
                    return BadRequest(new { message = "User is already in this competition." });

                var member = new CompetitionMember
                {
                    CompetitionId = model.CompetitionId,
                    UserId = model.UserId,
                    Role = "participant",
                    JoinedAt = DateTime.UtcNow
                };

                _context.CompetitionMembers.Add(member);
                await _context.SaveChangesAsync();

                return Ok(new { message = "User invited successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("{id}/members")]
        public async Task<IActionResult> GetMembers(int id)
        {
            var members = await _context.CompetitionMembers
                .Where(cm => cm.CompetitionId == id)
                .Join(_context.Users,
                    cm => cm.UserId,
                    u => u.Id,
                    (cm, u) => new
                    {
                        cm.Id,
                        cm.UserId,
                        u.Name,
                        cm.Role,
                        cm.Tier,
                        cm.JoinedAt
                    })
                .ToListAsync();

            return Ok(members);
        }

        [HttpPut("members/{memberId}/tier")]
        public async Task<IActionResult> UpdateMemberTier([FromBody] UpdateTierModel model, int memberId)
        {
            try
            {
                var member = await _context.CompetitionMembers.FindAsync(memberId);
                if (member == null)
                    return NotFound(new { message = "Member not found." });

                member.Tier = model.Tier;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Tier updated!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }

    public class CreateCompetitionModel
    {
        public string Name { get; set; } = string.Empty;
        public string? StartDate { get; set; }
        public string? EndDate { get; set; }
        public int CreatedBy { get; set; }
    }

    public class InviteModel
    {
        public int CompetitionId { get; set; }
        public int UserId { get; set; }
    }

    public class UpdateTierModel
    {
        public int Tier { get; set; }
    }
}