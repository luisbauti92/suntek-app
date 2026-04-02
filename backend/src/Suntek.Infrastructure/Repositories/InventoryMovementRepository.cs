using Microsoft.EntityFrameworkCore;
using Suntek.Domain.Entities;
using Suntek.Domain.Enums;
using Suntek.Domain.Interfaces;
using Suntek.Infrastructure.Persistence;

namespace Suntek.Infrastructure.Repositories;

public class InventoryMovementRepository(AppDbContext db) : IInventoryMovementRepository
{
    public async Task<InventoryMovement> AddAsync(InventoryMovement movement, CancellationToken ct = default)
    {
        db.InventoryMovements.Add(movement);
        await db.SaveChangesAsync(ct);
        return movement;
    }

    public async Task<(IReadOnlyList<InventoryMovement> Items, int TotalCount, decimal TotalSalesBsInRange, int ResolvedPage)> GetMovementHistoryPageAsync(
        DateTime? startDateUtc,
        DateTime? endDateUtc,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var nowUtc = DateTime.UtcNow;

        var effectiveEndUtc = endDateUtc.HasValue
            ? DateTime.SpecifyKind(endDateUtc.Value, DateTimeKind.Utc)
            : nowUtc;

        var effectiveStartUtc = startDateUtc.HasValue
            ? DateTime.SpecifyKind(startDateUtc.Value, DateTimeKind.Utc)
            : effectiveEndUtc.AddDays(-30);

        var baseFilter = db.InventoryMovements
            .AsNoTracking()
            .Where(x => x.CreatedAt >= effectiveStartUtc && x.CreatedAt <= effectiveEndUtc);

        var totalCount = await baseFilter.CountAsync(ct);

        var totalSalesBsInRange = await baseFilter
            .Where(m => m.MovementType == MovementType.Sale && m.Sale != null)
            .SumAsync(m => m.Sale!.TotalPrice, ct);

        var totalPages = totalCount == 0 ? 1 : (int)Math.Ceiling(totalCount / (double)pageSize);
        var effectivePage = page > totalPages ? totalPages : page;
        if (effectivePage < 1) effectivePage = 1;

        var items = await baseFilter
            .Include(x => x.Product)
            .Include(x => x.Sale)
            .OrderByDescending(x => x.CreatedAt)
            .Skip((effectivePage - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, totalCount, totalSalesBsInRange, effectivePage);
    }

    public async Task<IReadOnlyList<InventoryMovement>> GetSalesMovementsByDateRangeAsync(
        DateTime startUtc,
        DateTime endUtc,
        CancellationToken ct = default)
    {
        return await db.InventoryMovements
            .Include(x => x.Product)
            .Include(x => x.Sale)
            .Where(x => x.MovementType == MovementType.Sale
                        && x.Sale != null
                        && x.CreatedAt >= startUtc
                        && x.CreatedAt <= endUtc)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync(ct);
    }
}
