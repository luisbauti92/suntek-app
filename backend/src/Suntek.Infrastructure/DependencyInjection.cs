using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Suntek.Domain.Interfaces;
using Suntek.Infrastructure.Identity;
using Suntek.Infrastructure.Persistence;
using Suntek.Infrastructure.Repositories;
using Suntek.Infrastructure.Services;

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
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ISaleRepository, SaleRepository>();
        services.AddScoped<IInventoryMovementRepository, InventoryMovementRepository>();
        services.AddScoped<Application.Common.Interfaces.IExcelService, ExcelService>();
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }
}
