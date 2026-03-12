using Microsoft.EntityFrameworkCore;
using Suntek.Domain.Entities;
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

    public async Task<IReadOnlyList<InventoryMovement>> GetAllOrderedByDateDescAsync(CancellationToken ct = default)
    {
        return await db.InventoryMovements
            .Include(x => x.Product)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);
    }
}
