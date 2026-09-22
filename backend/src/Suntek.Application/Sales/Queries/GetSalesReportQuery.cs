using MediatR;

namespace Suntek.Application.Sales.Queries;

public record GetSalesReportQuery(
    DateTime? StartDateUtc,
    DateTime? EndDateUtc,
    string Language) : IRequest<byte[]>;
