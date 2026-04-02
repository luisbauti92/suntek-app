using FastEndpoints;
using MediatR;
using Suntek.Application.Sales.Queries;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Sales;

public class MovementHistoryRequest
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

public class MovementDtoResponse
{
    public int Id { get; set; }
    public string MovementType { get; set; } = string.Empty; // Register, OpenBox, Sale, Adjustment
    public int ProductId { get; set; }
    public string ProductSku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public string QuantityUnit { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? WholesaleQuantityAfter { get; set; }
    public decimal? RetailQuantityAfter { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? SaleId { get; set; }
    public decimal? SaleUnitPriceBs { get; set; }
    public decimal? SaleTotalBs { get; set; }
}

public class MovementHistoryPagedResponse
{
    public List<MovementDtoResponse> Items { get; set; } = [];
    public int TotalCount { get; set; }
    public decimal TotalSalesBsInRange { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class ListMovementsEndpoint(IMediator mediator) : Endpoint<MovementHistoryRequest, MovementHistoryPagedResponse>
{
    public override void Configure()
    {
        Get("/api/sales/movements");
        Roles(AppRoles.Admin, AppRoles.Operator);
    }

    public override async Task HandleAsync(MovementHistoryRequest req, CancellationToken ct)
    {
        var page = req.Page < 1 ? 1 : req.Page;
        var pageSize = Math.Clamp(req.PageSize <= 0 ? 25 : req.PageSize, 1, 100);

        var result = await mediator.Send(
            new GetMovementHistoryQuery(req.StartDate, req.EndDate, page, pageSize),
            ct);

        Response = new MovementHistoryPagedResponse
        {
            Items = result.Items.Select(m => new MovementDtoResponse
            {
                Id = m.Id,
                MovementType = m.MovementType.ToString(),
                ProductId = m.ProductId,
                ProductSku = m.ProductSku,
                ProductName = m.ProductName,
                Quantity = m.Quantity,
                QuantityUnit = m.QuantityUnit,
                Description = m.Description,
                WholesaleQuantityAfter = m.WholesaleQuantityAfter,
                RetailQuantityAfter = m.RetailQuantityAfter,
                CreatedAt = m.CreatedAt,
                SaleId = m.SaleId,
                SaleUnitPriceBs = m.SaleUnitPriceBs,
                SaleTotalBs = m.SaleTotalBs
            }).ToList(),
            TotalCount = result.TotalCount,
            TotalSalesBsInRange = result.TotalSalesBsInRange,
            Page = result.Page,
            PageSize = result.PageSize
        };
        await Send.OkAsync(Response, ct);
    }
}
