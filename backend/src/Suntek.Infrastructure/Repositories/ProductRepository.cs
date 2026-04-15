using Microsoft.EntityFrameworkCore;
using Suntek.Domain.Entities;
using Suntek.Domain.Enums;
using Suntek.Domain.Interfaces;
using Suntek.Infrastructure.Persistence;

namespace Suntek.Infrastructure.Repositories;

public class ProductRepository(AppDbContext db) : IProductRepository
{
    public async Task<IReadOnlyList<Product>> GetAllAsync(ProductStatus? status = null, CancellationToken ct = default)
    {
        IQueryable<Product> query = status == ProductStatus.Archived
            ? db.Products.IgnoreQueryFilters().Where(x => x.Status == ProductStatus.Archived)
            : status.HasValue
                ? db.Products.Where(x => x.Status == status.Value)
                : db.Products;

        return await query.OrderBy(x => x.Sku).ToListAsync(ct);
    }

    public async Task<Product?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await db.Products.FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public async Task<Product?> GetByIdIncludingArchivedAsync(int id, CancellationToken ct = default)
    {
        return await db.Products
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public async Task<Product?> GetBySkuAsync(string sku, CancellationToken ct = default)
    {
        return await db.Products.FirstOrDefaultAsync(x => x.Sku == sku, ct);
    }

    public async Task<bool> IsSkuTakenByOtherAsync(string sku, int excludeProductId, CancellationToken ct = default)
    {
        return await db.Products.AnyAsync(x => x.Sku == sku && x.Id != excludeProductId, ct);
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
