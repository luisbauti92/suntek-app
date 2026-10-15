using MediatR;
using Suntek.Application.Common.Interfaces;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Catalog.Images;

public class SetPrimaryProductImageCommandHandler(
    IProductImageRepository imageRepository,
    IUnitOfWork unitOfWork,
    IImageStorageService storage) : IRequestHandler<SetPrimaryProductImageCommand, ProductImageResult>
{
    public async Task<ProductImageResult> Handle(SetPrimaryProductImageCommand request, CancellationToken ct)
    {
        var image = await imageRepository.GetByIdAsync(request.ImageId, ct);
        if (image is null || image.ProductId != request.ProductId)
            return new ProductImageResult(null, ProductImageError.ImageNotFound);

        await unitOfWork.ExecuteInTransactionAsync(async c =>
        {
            var images = await imageRepository.GetByProductIdAsync(request.ProductId, c);
            foreach (var candidate in images)
            {
                var shouldBePrimary = candidate.Id == request.ImageId;
                if (candidate.IsPrimary == shouldBePrimary)
                    continue;

                candidate.IsPrimary = shouldBePrimary;
                await imageRepository.UpdateAsync(candidate, c);
            }
        }, ct);

        image.IsPrimary = true;
        return new ProductImageResult(image.ToDto(storage), ProductImageError.None);
    }
}
