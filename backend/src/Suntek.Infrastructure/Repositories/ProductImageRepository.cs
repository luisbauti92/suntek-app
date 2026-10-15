using Microsoft.EntityFrameworkCore;
using Suntek.Domain.Entities;
using Suntek.Domain.Interfaces;
using Suntek.Infrastructure.Persistence;

namespace Suntek.Infrastructure.Repositories;

public class ProductImageRepository(AppDbContext db) : IProductImageRepository
{
    public async Task<IReadOnlyList<ProductImage>> GetByProductIdAsync(int productId, CancellationToken ct = default)
    {
        return await db.ProductImages
            .Where(x => x.ProductId == productId)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Id)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ProductImage>> GetByProductIdsAsync(
        IReadOnlyCollection<int> productIds, CancellationToken ct = default)
    {
        if (productIds.Count == 0)
            return [];

        return await db.ProductImages
            .Where(x => productIds.Contains(x.ProductId))
            .OrderBy(x => x.ProductId)
            .ThenBy(x => x.SortOrder)
            .ThenBy(x => x.Id)
            .ToListAsync(ct);
    }

    public async Task<ProductImage?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        return await db.ProductImages.FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public async Task AddAsync(ProductImage image, CancellationToken ct = default)
    {
        db.ProductImages.Add(image);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(ProductImage image, CancellationToken ct = default)
    {
        db.ProductImages.Update(image);
        await db.SaveChangesAsync(ct);
    }

    public async Task UpdateRangeAsync(IEnumerable<ProductImage> images, CancellationToken ct = default)
    {
        db.ProductImages.UpdateRange(images);
        await db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(ProductImage image, CancellationToken ct = default)
    {
        db.ProductImages.Remove(image);
        await db.SaveChangesAsync(ct);
    }
}
