using Suntek.Domain.Entities;

namespace Suntek.Domain.Interfaces;

public interface IProductImageRepository
{
    /// <summary>Images of a product ordered deterministically (SortOrder, then Id).</summary>
    Task<IReadOnlyList<ProductImage>> GetByProductIdAsync(int productId, CancellationToken ct = default);
    /// <summary>Images for several products in one round trip, ordered the same way.</summary>
    Task<IReadOnlyList<ProductImage>> GetByProductIdsAsync(IReadOnlyCollection<int> productIds, CancellationToken ct = default);
    Task<ProductImage?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(ProductImage image, CancellationToken ct = default);
    Task UpdateAsync(ProductImage image, CancellationToken ct = default);
    Task UpdateRangeAsync(IEnumerable<ProductImage> images, CancellationToken ct = default);
    Task DeleteAsync(ProductImage image, CancellationToken ct = default);
}
