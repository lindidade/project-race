using System;
using System.Collections.Generic;

namespace project_race_backend_csharp.Models;

public partial class User
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string? Role { get; set; }
    public int? Tier { get; set; }
    public int? TeamId { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? PrivacySetting { get; set; }
    public virtual ICollection<Activity> Activities { get; set; } = new List<Activity>();
    public virtual ICollection<CompetitionMember> CompetitionMembers { get; set; } = new List<CompetitionMember>();
    public virtual ICollection<Competition> Competitions { get; set; } = new List<Competition>();
    public virtual ICollection<Friend> FriendUserId1Navigations { get; set; } = new List<Friend>();
    public virtual ICollection<Friend> FriendUserId2Navigations { get; set; } = new List<Friend>();
    public virtual ICollection<TeamMember> TeamMembers { get; set; } = new List<TeamMember>();
}