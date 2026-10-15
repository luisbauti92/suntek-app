using MediatR;

namespace Suntek.Application.Catalog.Images;

public record SetPrimaryProductImageCommand(int ProductId, int ImageId) : IRequest<ProductImageResult>;
