using System;

namespace project_race_backend_csharp.Models;

public partial class Activity
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public int? TeamId { get; set; }
    public decimal? Distance { get; set; }
    public DateOnly? Date { get; set; }
    public DateTime? CreatedAt { get; set; }
    public virtual User? User { get; set; }
    public virtual Team? Team { get; set; }
}