using FastEndpoints;
using MediatR;
using Suntek.Application.Sales.Queries;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Sales;

public class ExportSalesReportRequest
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

public class ExportSalesReportEndpoint(IMediator mediator) : Endpoint<ExportSalesReportRequest>
{
    public override void Configure()
    {
        Get("/api/sales/export");
        Roles(AppRoles.Admin, AppRoles.Operator);
    }

    public override async Task HandleAsync(ExportSalesReportRequest req, CancellationToken ct)
    {
        var bytes = await mediator.Send(
            new GetSalesReportQuery(req.StartDate, req.EndDate),
            ct);

        await Send.StreamAsync(
            new MemoryStream(bytes),
            "Suntek_Sales_Report.xlsx",
            bytes.Length,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            cancellation: ct);
    }
}
