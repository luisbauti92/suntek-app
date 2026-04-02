namespace Suntek.Application.Common.Models;

public record MovementHistoryPageResult(
    IReadOnlyList<MovementDto> Items,
    int TotalCount,
    decimal TotalSalesBsInRange,
    int Page,
    int PageSize);
