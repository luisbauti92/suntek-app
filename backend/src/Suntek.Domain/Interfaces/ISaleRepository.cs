using Suntek.Domain.Entities;

namespace Suntek.Domain.Interfaces;

public interface ISaleRepository
{
    Task<Sale> AddAsync(Sale sale, CancellationToken ct = default);
}
