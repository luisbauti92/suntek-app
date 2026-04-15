using MediatR;
using Suntek.Domain.Enums;

namespace Suntek.Application.Inventory.Commands;

public record UpdateProductStatusCommand(int Id, ProductStatus Status) : IRequest<bool>;
