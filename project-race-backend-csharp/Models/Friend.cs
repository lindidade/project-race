using System;
using project_race_backend_csharp.Models;

namespace project_race_backend_csharp.Models;

public partial class Friend
{
    public int Id { get; set; }
    public int? UserId1 { get; set; }
    public int? UserId2 { get; set; }
    public string? Status { get; set; }
    public DateTime? CreatedAt { get; set; }
    public virtual User? UserId1Navigation { get; set; }
    public virtual User? UserId2Navigation { get; set; }
}