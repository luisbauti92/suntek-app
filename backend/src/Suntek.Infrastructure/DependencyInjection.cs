using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Suntek.Domain.Interfaces;
using Suntek.Infrastructure.Identity;
using Suntek.Infrastructure.Persistence;
using Suntek.Infrastructure.Repositories;
using Suntek.Infrastructure.Services;
using Suntek.Infrastructure.Storage;

namespace Suntek.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
            {
                // Migrations live in Infrastructure; keep explicit for publish/Docker runs.
                npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.GetName().Name!);
            }));

        services.AddIdentity<AppUser, IdentityRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequiredLength = 8;
        })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IProductImageRepository, ProductImageRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ISaleRepository, SaleRepository>();
        services.AddScoped<IInventoryMovementRepository, InventoryMovementRepository>();
        services.AddScoped<Application.Common.Interfaces.IExcelService, ExcelService>();
        services.AddScoped<IAuthService, AuthService>();

        // Cloudflare R2 image storage. Bound manually from configuration so no extra options package
        // is needed; credentials come from the environment/secret store, never from appsettings.
        var r2Options = new R2Options
        {
            BucketName = configuration["CloudflareR2:BucketName"] ?? string.Empty,
            Endpoint = configuration["CloudflareR2:Endpoint"] ?? string.Empty,
            AccessKeyId = configuration["CloudflareR2:AccessKeyId"] ?? string.Empty,
            SecretAccessKey = configuration["CloudflareR2:SecretAccessKey"] ?? string.Empty,
            PublicBaseUrl = configuration["CloudflareR2:PublicBaseUrl"] ?? string.Empty,
            KeyPrefix = configuration["CloudflareR2:KeyPrefix"] is { Length: > 0 } prefix
                ? prefix
                : R2Options.DefaultKeyPrefix,
            MaxFileSizeBytes = long.TryParse(configuration["CloudflareR2:MaxFileSizeBytes"], out var maxBytes) && maxBytes > 0
                ? maxBytes
                : R2Options.DefaultMaxFileSizeBytes,
        };

        services.AddSingleton(r2Options);
        services.AddSingleton<Application.Common.Interfaces.IImageStorageService, R2ImageStorageService>();

        return services;
    }
}
