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
        // POST api/competitions/{id}/randomize-teams
[HttpPost("{id}/randomize-teams")]
public async Task<IActionResult> RandomizeTeams(int id, [FromBody] RandomizeTeamsModel model)
{
    if (model.NumberOfTeams < 2 || model.NumberOfTeams > 5)
        return BadRequest(new { message = "Number of teams must be between 2 and 5." });

    // Fetch all participants with their tiers, sorted best to worst (tier 1 = best)
    var participants = await _context.CompetitionMembers
        .Where(cm => cm.CompetitionId == id && cm.Tier != null)
        .Join(_context.Users,
            cm => cm.UserId,
            u => u.Id,
            (cm, u) => new { cm.UserId, cm.Tier, u.Name })
        .OrderBy(p => p.Tier)
        .ToListAsync();

    if (participants.Count == 0)
        return BadRequest(new { message = "No participants with tiers found." });

    // Snake draft: distribute players across teams for balanced tiers
    var buckets = new List<List<(int UserId, int Tier, string Name)>>();
    for (int i = 0; i < model.NumberOfTeams; i++)
        buckets.Add(new List<(int, int, string)>());

    bool goingRight = true;
    int teamIndex = 0;

    foreach (var p in participants)
    {
        buckets[teamIndex].Add((p.UserId!.Value, p.Tier!.Value, p.Name ?? ""));

        if (goingRight)
        {
            if (teamIndex == model.NumberOfTeams - 1) goingRight = false;
            else teamIndex++;
        }
        else
        {
            if (teamIndex == 0) goingRight = true;
            else teamIndex--;
        }
    }

    // Delete existing teams for this competition
    var existingTeams = await _context.Teams
        .Where(t => t.CompetitionId == id)
        .Include(t => t.TeamMembers)
        .ToListAsync();

    foreach (var team in existingTeams)
        _context.TeamMembers.RemoveRange(team.TeamMembers);

    _context.Teams.RemoveRange(existingTeams);
    await _context.SaveChangesAsync();

    // Create new teams and members
    var result = new List<object>();

    for (int i = 0; i < buckets.Count; i++)
    {
        var team = new Team
        {
            Name = $"Team {i + 1}",
            CompetitionId = id
        };
        _context.Teams.Add(team);
        await _context.SaveChangesAsync();

        foreach (var player in buckets[i])
        {
            _context.TeamMembers.Add(new TeamMember
            {
                TeamId = team.Id,
                UserId = player.UserId,
                JoinedAt = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        result.Add(new
        {
            teamId = team.Id,
            teamName = team.Name,
            members = buckets[i].Select(p => new
            {
                userId = p.UserId,
                name = p.Name,
                tier = p.Tier
            })
        });
    }

    return Ok(result);
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

    public class RandomizeTeamsModel
    {
        public int NumberOfTeams { get; set; }
    }
}