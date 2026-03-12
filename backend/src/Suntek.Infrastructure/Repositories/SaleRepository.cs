using Suntek.Domain.Entities;
using Suntek.Domain.Interfaces;
using Suntek.Infrastructure.Persistence;

namespace Suntek.Infrastructure.Repositories;

public class SaleRepository(AppDbContext db) : ISaleRepository
{
    public async Task<Sale> AddAsync(Sale sale, CancellationToken ct = default)
    {
        db.Sales.Add(sale);
        await db.SaveChangesAsync(ct);
        return sale;
    }
}
