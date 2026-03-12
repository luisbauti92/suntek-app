using Microsoft.EntityFrameworkCore;
using Suntek.Domain.Entities;
using Suntek.Domain.Interfaces;
using Suntek.Infrastructure.Persistence;

namespace Suntek.Infrastructure.Repositories;

public class ProductRepository(AppDbContext db) : IProductRepository
{
    public async Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken ct = default)
    {
        return await db.Products.OrderBy(x => x.Sku).ToListAsync(ct);
    }

    public async Task<Product?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await db.Products.FindAsync([id], ct);
    }

    public async Task<Product?> GetBySkuAsync(string sku, CancellationToken ct = default)
    {
        return await db.Products.FirstOrDefaultAsync(x => x.Sku == sku, ct);
    }

    public async Task<Product> AddAsync(Product product, CancellationToken ct = default)
    {
        db.Products.Add(product);
        await db.SaveChangesAsync(ct);
        return product;
    }

    public async Task UpdateAsync(Product product, CancellationToken ct = default)
    {
        db.Products.Update(product);
        await db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(Product product, CancellationToken ct = default)
    {
        db.Products.Remove(product);
        await db.SaveChangesAsync(ct);
    }
}
