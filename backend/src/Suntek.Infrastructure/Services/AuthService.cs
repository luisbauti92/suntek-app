using FastEndpoints.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Suntek.Domain.Enums;
using Suntek.Domain.Interfaces;
using Suntek.Infrastructure.Identity;

namespace Suntek.Infrastructure.Services;

public class AuthService(
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager,
    IConfiguration configuration) : IAuthService
{
    public async Task<AuthResult> LoginAsync(string email, string password, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user == null)
            throw new UnauthorizedAccessException("Invalid email or password.");

        var result = await signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: false);
        if (!result.Succeeded)
            throw new UnauthorizedAccessException("Invalid email or password.");

        user.LastLoginAt = DateTime.UtcNow;
        await userManager.UpdateAsync(user);

        var roles = await userManager.GetRolesAsync(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(configuration.GetValue<int>("Jwt:ExpirationMinutes", 60));
        var jwtToken = JwtBearer.CreateToken(o =>
        {
            o.SigningKey = configuration["Jwt:SecurityKey"] ?? throw new InvalidOperationException("JWT SecurityKey not configured.");
            o.ExpireAt = expiresAt;
            o.User.Roles.AddRange(roles);
            o.User.Claims.Add(("Email", user.Email ?? string.Empty));
            o.User.Claims.Add(("UserId", user.Id));
            o.User["sub"] = user.Id;
            o.Audience = configuration["Jwt:Audience"];
            o.Issuer = configuration["Jwt:Issuer"];
        });

        return new AuthResult(jwtToken, user.Email ?? string.Empty, [..roles], expiresAt);
    }

    public async Task<RegisterResult> RegisterAsync(string fullName, string email, string password, string? role, CancellationToken ct = default)
    {
        var existingUser = await userManager.FindByEmailAsync(email);
        if (existingUser != null)
            throw new InvalidOperationException("A user with this email already exists.");

        var roleName = string.IsNullOrWhiteSpace(role) ? AppRoles.Operator : role.Trim();
        if (roleName is not (AppRoles.Admin or AppRoles.Operator))
            throw new InvalidOperationException("Role must be Admin or Operator.");

        var user = new AppUser
        {
            UserName = email,
            Email = email,
            FullName = fullName,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException(errors);
        }

        await userManager.AddToRoleAsync(user, roleName);

        return new RegisterResult(user.Id, user.Email ?? string.Empty, user.FullName, "Registration successful. You can now log in.");
    }
}
