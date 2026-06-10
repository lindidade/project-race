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

        modelBuilder.Entity<Team>(entity =>
        {
            entity.ToTable("teams");
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Id).HasColumnName("id");
            entity.Property(t => t.Name).HasColumnName("name");
        });

        modelBuilder.Entity<Friend>(entity =>
        {
            entity.ToTable("friends");
            entity.HasKey(f => f.Id);
            entity.HasOne(f => f.UserId1Navigation)
                .WithMany()
                .HasForeignKey(f => f.UserId1)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(f => f.UserId2Navigation)
                .WithMany()
                .HasForeignKey(f => f.UserId2)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Competition>().ToTable("competitions");
        modelBuilder.Entity<CompetitionMember>().ToTable("competition_members");
        modelBuilder.Entity<TeamMember>().ToTable("team_members");
    }
}