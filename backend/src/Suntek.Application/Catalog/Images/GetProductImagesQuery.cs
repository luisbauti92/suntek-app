using MediatR;

namespace Suntek.Application.Catalog.Images;

public record GetProductImagesQuery(int ProductId) : IRequest<ProductImageListResult>;
