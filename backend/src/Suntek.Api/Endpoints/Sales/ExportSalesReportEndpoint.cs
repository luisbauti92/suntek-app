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
            new GetSalesReportQuery(req.StartDate, req.EndDate, ResolveLanguage()),
            ct);

        await Send.StreamAsync(
            new MemoryStream(bytes),
            "Suntek_Sales_Report.xlsx",
            bytes.Length,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            cancellation: ct);
    }

    /// <summary>
    /// Reads the caller's language from <c>Accept-Language</c>. Anything that is not English
    /// falls back to Spanish, which is the default for the whole application.
    /// </summary>
    private string ResolveLanguage()
    {
        var header = HttpContext.Request.Headers.AcceptLanguage.ToString();
        var primary = header.Split(',')[0].Split(';')[0].Trim();

        return primary.StartsWith("en", StringComparison.OrdinalIgnoreCase) ? "en" : "es";
    }
}
