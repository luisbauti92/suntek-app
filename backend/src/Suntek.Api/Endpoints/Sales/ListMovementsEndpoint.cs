using FastEndpoints;
using MediatR;
using Suntek.Application.Sales.Queries;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Sales;

public class MovementHistoryRequest
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
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

public class ListMovementsEndpoint(IMediator mediator) : Endpoint<MovementHistoryRequest, List<MovementDtoResponse>>
{
    public override void Configure()
    {
        Get("/api/sales/movements");
        Roles(AppRoles.Admin, AppRoles.Operator);
    }

    public override async Task HandleAsync(MovementHistoryRequest req, CancellationToken ct)
    {
        var movements = await mediator.Send(
            new GetMovementHistoryQuery(req.StartDate, req.EndDate),
            ct);
        Response = movements.Select(m => new MovementDtoResponse
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
        }).ToList();
        await Send.OkAsync(Response, ct);
    }
}
