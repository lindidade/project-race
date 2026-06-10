using System;

namespace project_race_backend_csharp.Models;

public partial class CompetitionMember
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public int? CompetitionId { get; set; }
    public DateTime? JoinedAt { get; set; }
    public virtual User? User { get; set; }
    public virtual Competition? Competition { get; set; }
}