using System;

namespace project_race_backend_csharp.Models;

public partial class TeamMember
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public int? TeamId { get; set; }
    public DateTime? JoinedAt { get; set; }
    public virtual User? User { get; set; }
    public virtual Team? Team { get; set; }
}