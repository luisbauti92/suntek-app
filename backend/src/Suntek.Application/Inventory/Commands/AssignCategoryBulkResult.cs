namespace Suntek.Application.Inventory.Commands;

public enum AssignCategoryBulkError
{
    /// <summary>No llegó ningún id: no hay nada que asignar.</summary>
    EmptySelection,

    /// <summary>Alguno de los ids no existe o está archivado; no se actualiza nada.</summary>
    ProductNotFound,
}

/// <summary>
/// <see cref="MissingIds"/> sólo tiene valor cuando falla por <see cref="AssignCategoryBulkError.ProductNotFound"/>,
/// para que el endpoint pueda decir exactamente qué ids no encontró.
/// </summary>
public record AssignCategoryBulkResult(
    int UpdatedCount,
    IReadOnlyList<int> MissingIds,
    AssignCategoryBulkError? Error);
