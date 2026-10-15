using MediatR;

namespace Suntek.Application.Catalog.Images;

public record ReplaceProductImageCommand(int ProductId, int ImageId, Stream Content, string? FileName)
    : IRequest<ProductImageResult>;
