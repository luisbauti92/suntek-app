using MediatR;
using Suntek.Application.Common.Models;

namespace Suntek.Application.Sales.Queries;

public record GetMovementHistoryQuery(
    DateTime? StartDateUtc,
    DateTime? EndDateUtc,
    int Page,
    int PageSize) : IRequest<MovementHistoryPageResult>;
