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

    public async Task<IReadOnlyList<InventoryMovement>> GetByDateRangeOrderedByDateDescAsync(
        DateTime? startDateUtc,
        DateTime? endDateUtc,
        CancellationToken ct = default)
    {
        var nowUtc = DateTime.UtcNow;

        var effectiveEndUtc = endDateUtc.HasValue
            ? DateTime.SpecifyKind(endDateUtc.Value, DateTimeKind.Utc)
            : nowUtc;

        var effectiveStartUtc = startDateUtc.HasValue
            ? DateTime.SpecifyKind(startDateUtc.Value, DateTimeKind.Utc)
            : effectiveEndUtc.AddDays(-30);

        return await db.InventoryMovements
            .Include(x => x.Product)
            .Include(x => x.Sale)
            .Where(x => x.CreatedAt >= effectiveStartUtc && x.CreatedAt <= effectiveEndUtc)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);
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
