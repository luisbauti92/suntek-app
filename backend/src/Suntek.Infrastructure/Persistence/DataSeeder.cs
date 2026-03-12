using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Suntek.Domain.Enums;
using Suntek.Infrastructure.Identity;

namespace Suntek.Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedRolesAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var roleName in new[] { AppRoles.Admin, AppRoles.Operator })
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }
    }

    public static async Task SeedAdminUserAsync(IServiceProvider serviceProvider)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();
        const string adminEmail = "admin@suntek.com";
        const string adminPassword = "Admin@123";

        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser != null)
            return;

        adminUser = new AppUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            FullName = "System Administrator",
            EmailConfirmed = true
        };

        await userManager.CreateAsync(adminUser, adminPassword);
        await userManager.AddToRoleAsync(adminUser, AppRoles.Admin);
    }
}
