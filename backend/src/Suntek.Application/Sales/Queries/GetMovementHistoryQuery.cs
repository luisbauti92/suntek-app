using MediatR;
using Suntek.Application.Common.Models;

namespace Suntek.Application.Sales.Queries;

public record GetMovementHistoryQuery : IRequest<IReadOnlyList<MovementDto>>;
