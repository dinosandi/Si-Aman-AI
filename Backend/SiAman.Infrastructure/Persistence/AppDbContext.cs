using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using SiAman.Application.Common.Interfaces;
using SiAman.Domain.Entities;

namespace SiAman.Infrastructure.Persistence
{
    public class AppDbContext : DbContext, IAppDbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Users> Users => Set<Users>();
        public DbSet<RefreshTokens> RefreshTokens => Set<RefreshTokens>();
        public DbSet<UserLocations> UserLocations => Set<UserLocations>();      // ← PascalCase
        public DbSet<EmergencyContacts> EmergencyContacts => Set<EmergencyContacts>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Aktifkan extension PostGIS di schema migration
            modelBuilder.HasPostgresExtension("postgis");
            modelBuilder.HasPostgresExtension("uuid-ossp");

            // ── USERS ──────────────────────────────────────────────────
            modelBuilder.Entity<Users>(entity =>
            {
                entity.ToTable("users");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.Id)
                    .HasDefaultValueSql("uuid_generate_v4()");

                entity.Property(x => x.Email)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.HasIndex(x => x.Email)
                    .IsUnique()
                    .HasDatabaseName("idx_users_email");

                // Partial index: hanya unik jika ProviderId tidak null
                entity.HasIndex(x => new { x.Provider, x.ProviderId })
                    .IsUnique()
                    .HasFilter("provider_id IS NOT NULL")
                    .HasDatabaseName("idx_users_provider");

                entity.Property(x => x.Role)
                    .HasConversion<string>()
                    .HasColumnType("text");

                entity.Property(x => x.Provider)
                    .HasConversion<string>()
                    .HasColumnType("text");

                // PostGIS geometry column untuk cache lokasi terakhir
                entity.Property(x => x.CurrentLocation)
                    .HasColumnType("geometry(Point, 4326)");

                entity.Property(x => x.CreatedAt)
                    .HasDefaultValueSql("now()");

                entity.Property(x => x.UpdatedAt)
                    .HasDefaultValueSql("now()");

                // Relasi
                entity.HasMany(x => x.Locations)
                    .WithOne(x => x.User)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(x => x.RefreshTokens)
                    .WithOne(x => x.User)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(x => x.EmergencyContacts)
                    .WithOne(x => x.User)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ── USER LOCATIONS ─────────────────────────────────────────
            modelBuilder.Entity<UserLocations>(entity =>
            {
                entity.ToTable("user_locations");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.Id)
                    .HasDefaultValueSql("uuid_generate_v4()");

                // WAJIB: set column type PostGIS dengan SRID 4326
                entity.Property(x => x.Location)
                    .HasColumnType("geometry(Point, 4326)")
                    .IsRequired();

                // Index spasial GIST — wajib untuk performa ST_DWithin / ST_Distance
                entity.HasIndex(x => x.Location)
                    .HasMethod("GIST")
                    .HasDatabaseName("idx_user_locations_geom");

                // Index komposit untuk query history per user berurutan waktu
                entity.HasIndex(x => new { x.UserId, x.RecordedAt })
                    .HasDatabaseName("idx_user_locations_user_time");

                entity.Property(x => x.RecordedAt)
                    .HasDefaultValueSql("now()");
            });

            // ── REFRESH TOKENS ─────────────────────────────────────────
            modelBuilder.Entity<RefreshTokens>(entity =>
            {
                // Relasi ke Users — UserId bukan UsersId
                entity.HasOne(x => x.User)
                    .WithMany(x => x.RefreshTokens)
                    .HasForeignKey(x => x.UserId)       
                    .OnDelete(DeleteBehavior.Cascade);

                entity.ToTable("refresh_tokens");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.Id)
                    .HasDefaultValueSql("uuid_generate_v4()");

                entity.Property(x => x.TokenHash)
                    .IsRequired()
                    .HasMaxLength(512);
                // Ignore computed properties — tidak di-map ke kolom DB
                entity.Ignore(x => x.IsActive);
                entity.Ignore(x => x.IsExpired);
                entity.Ignore(x => x.IsRevoked);

                // Index untuk lookup cepat saat validasi refresh token
                entity.HasIndex(x => x.TokenHash)
                    .HasDatabaseName("idx_refresh_tokens_hash");

                entity.HasIndex(x => new { x.UserId, x.CreatedAt })
                    .HasDatabaseName("idx_refresh_tokens_user");

                entity.Property(x => x.CreatedAt)
                    .HasDefaultValueSql("now()");


            });

            // ── EMERGENCY CONTACTS ─────────────────────────────────────
            modelBuilder.Entity<EmergencyContacts>(entity =>
            {
                entity.ToTable("emergency_contacts");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.Id)
                    .HasDefaultValueSql("uuid_generate_v4()");

                entity.Property(x => x.ContactName)
                    .IsRequired()
                    .HasMaxLength(255);

                entity.Property(x => x.ContactPhone)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(x => x.CreatedAt)
                    .HasDefaultValueSql("now()");
            });
        }
    }
}