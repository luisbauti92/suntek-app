using MediatR;
using Suntek.Application.Common.Models;

namespace Suntek.Application.Sales.Queries;

public record GetMovementHistoryQuery(
    DateTime? StartDateUtc,
    DateTime? EndDateUtc) : IRequest<IReadOnlyList<MovementDto>>;
