using System;
using System.Collections.Generic;

namespace project_race_backend_csharp.Models;

public partial class Team
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public virtual ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public virtual ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();
}