using MediatR;

namespace Suntek.Application.Inventory.Commands;

public record DeleteProductCommand(int Id) : IRequest<bool>;
