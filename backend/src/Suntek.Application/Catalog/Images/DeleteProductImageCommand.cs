using MediatR;

namespace Suntek.Application.Catalog.Images;

public record DeleteProductImageCommand(int ProductId, int ImageId) : IRequest<ProductImageOperationResult>;
