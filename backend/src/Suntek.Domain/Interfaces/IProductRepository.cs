using Suntek.Domain.Entities;
using Suntek.Domain.Enums;

namespace Suntek.Domain.Interfaces;

public interface IProductRepository
{
    Task<IReadOnlyList<Product>> GetAllAsync(ProductStatus? status = null, CancellationToken ct = default);
    /// <summary>Productos no archivados para los ids indicados (respeta el filtro global).</summary>
    Task<IReadOnlyList<Product>> GetByIdsAsync(IReadOnlyCollection<int> ids, CancellationToken ct = default);
    Task<Product?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<Product?> GetByIdIncludingArchivedAsync(int id, CancellationToken ct = default);
    Task<Product?> GetBySkuAsync(string sku, CancellationToken ct = default);
    Task<bool> IsSkuTakenByOtherAsync(string sku, int excludeProductId, CancellationToken ct = default);
    Task<Product> AddAsync(Product product, CancellationToken ct = default);
    Task UpdateAsync(Product product, CancellationToken ct = default);
    /// <summary>Persiste todos los productos en un solo SaveChanges (atómico).</summary>
    Task UpdateRangeAsync(IEnumerable<Product> products, CancellationToken ct = default);
    Task DeleteAsync(Product product, CancellationToken ct = default);
}
