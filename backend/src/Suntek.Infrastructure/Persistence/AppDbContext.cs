using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Suntek.Domain.Entities;
using Suntek.Infrastructure.Identity;

namespace Suntek.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Product>(e =>
        {
            e.ToTable("InventoryItems");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Sku).IsUnique();
        });
        modelBuilder.Entity<Sale>(e =>
        {
            e.ToTable("Sales");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<InventoryMovement>(e =>
        {
            e.ToTable("InventoryMovements");
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Sale).WithMany().HasForeignKey(x => x.SaleId).OnDelete(DeleteBehavior.SetNull);
        });
    }
}
