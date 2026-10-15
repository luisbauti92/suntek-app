using MediatR;

namespace Suntek.Application.Catalog.Images;

public record UploadProductImageCommand(int ProductId, Stream Content, string? FileName)
    : IRequest<ProductImageResult>;
