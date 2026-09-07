using Microsoft.EntityFrameworkCore;
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

    public async Task<IReadOnlyList<Sale>> GetSalesByDateRangeAsync(DateTime startUtc, DateTime endUtc, CancellationToken ct = default)
    {
        return await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
            db.Sales
                .Include(s => s.Product)
                .Where(s => s.CreatedAt >= startUtc && s.CreatedAt <= endUtc)
                .OrderByDescending(s => s.CreatedAt),
            ct);
    }
}
