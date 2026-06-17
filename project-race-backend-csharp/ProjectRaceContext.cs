using Microsoft.EntityFrameworkCore;
using project_race_backend_csharp.Models;

namespace project_race_backend_csharp;

public class ProjectRaceContext : DbContext
{
    public ProjectRaceContext(DbContextOptions<ProjectRaceContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Team> Teams { get; set; } = null!;
    public DbSet<Activity> Activities { get; set; } = null!;
    public DbSet<Friend> Friends { get; set; } = null!;
    public DbSet<Competition> Competitions { get; set; } = null!;
    public DbSet<CompetitionMember> CompetitionMembers { get; set; } = null!;
    public DbSet<TeamMember> TeamMembers { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Id).HasColumnName("id");
            entity.Property(u => u.Name).HasColumnName("name");
            entity.Property(u => u.Email).HasColumnName("email");
            entity.Property(u => u.PasswordHash).HasColumnName("password_hash");
            entity.Property(u => u.Role).HasColumnName("role");
            entity.Property(u => u.Tier).HasColumnName("tier");
            entity.Property(u => u.TeamId).HasColumnName("team_id");
            entity.Property(u => u.CreatedAt).HasColumnName("created_at");
            entity.Property(u => u.PrivacySetting).HasColumnName("privacy_setting");
            entity.Ignore(u => u.FriendUserId1Navigations);
            entity.Ignore(u => u.FriendUserId2Navigations);
            entity.Ignore(u => u.Competitions);
        });

        modelBuilder.Entity<Activity>(entity =>
        {
            entity.ToTable("activities");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Id).HasColumnName("id");
            entity.Property(a => a.UserId).HasColumnName("user_id");
            entity.Property(a => a.TeamId).HasColumnName("team_id");
            entity.Property(a => a.Distance).HasColumnName("distance");
            entity.Property(a => a.Date).HasColumnName("date");
            entity.Property(a => a.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<Friend>(entity =>
{
    entity.ToTable("friends");
    entity.HasKey(f => f.Id);
    entity.Property(f => f.Id).HasColumnName("id");
    entity.Property(f => f.UserId1).HasColumnName("user_id_1"); // ✅
    entity.Property(f => f.UserId2).HasColumnName("user_id_2"); // ✅
    entity.Property(f => f.Status).HasColumnName("status");
    entity.Property(f => f.CreatedAt).HasColumnName("created_at");

    entity.HasOne(f => f.UserId1Navigation)
        .WithMany()
        .HasForeignKey(f => f.UserId1)
        .OnDelete(DeleteBehavior.Restrict);

    entity.HasOne(f => f.UserId2Navigation)
        .WithMany()
        .HasForeignKey(f => f.UserId2)
        .OnDelete(DeleteBehavior.Restrict);
});

        modelBuilder.Entity<CompetitionMember>(entity =>
        {
            entity.ToTable("competition_members");
            entity.HasKey(cm => cm.Id);
            entity.Property(cm => cm.Id).HasColumnName("id");
            entity.Property(cm => cm.UserId).HasColumnName("user_id");
            entity.Property(cm => cm.CompetitionId).HasColumnName("competition_id");
            entity.Property(cm => cm.Role).HasColumnName("role");
            entity.Property(cm => cm.Tier).HasColumnName("tier");
            entity.Property(cm => cm.JoinedAt).HasColumnName("joined_at");
        });

        modelBuilder.Entity<Competition>(entity =>
        {
            entity.ToTable("competitions");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasColumnName("id");
            entity.Property(c => c.Name).HasColumnName("name");
            entity.Property(c => c.StartDate).HasColumnName("start_date");
            entity.Property(c => c.EndDate).HasColumnName("end_date");
            entity.Property(c => c.CreatedBy).HasColumnName("created_by");
            entity.Property(c => c.CreatedAt).HasColumnName("created_at");
            entity.Ignore(c => c.CreatedByNavigation);
            entity.Ignore(c => c.CompetitionMembers);
            entity.Property(c => c.Status).HasColumnName("status");
        });


        modelBuilder.Entity<TeamMember>(entity =>
        {
            entity.ToTable("team_members");
            entity.HasKey(tm => tm.Id);
            entity.Property(tm => tm.Id).HasColumnName("id");
            entity.Property(tm => tm.UserId).HasColumnName("user_id");
            entity.Property(tm => tm.TeamId).HasColumnName("team_id");
            entity.Property(tm => tm.JoinedAt).HasColumnName("joined_at");
        });

        modelBuilder.Entity<Team>(entity =>
        {
            entity.ToTable("teams");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Id).HasColumnName("id");
            entity.Property(t => t.Name).HasColumnName("name");
            entity.Property(t => t.CompetitionId).HasColumnName("competition_id");
        });
    }
}