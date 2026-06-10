using System;
using System.Collections.Generic;

namespace project_race_backend_csharp.Models;

public partial class Competition
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int? CreatedBy { get; set; }
    public DateTime? CreatedAt { get; set; }
    public virtual User? CreatedByNavigation { get; set; }
    public virtual ICollection<CompetitionMember> CompetitionMembers { get; set; } = new List<CompetitionMember>();
}