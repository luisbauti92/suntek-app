using FastEndpoints;
using Microsoft.AspNetCore.Identity;
using Suntek.Domain.Enums;
using Suntek.Infrastructure.Identity;

namespace Suntek.Api.Endpoints.Users;

public class UserListItemDto
{
    public string Id { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public IReadOnlyList<string> Roles { get; set; } = [];
    /// <summary>Active, Inactive, or Locked.</summary>
    public string Status { get; set; } = string.Empty;
    public DateTime? LastLoginAt { get; set; }
}

public class ListUsersEndpoint(UserManager<AppUser> userManager) : EndpointWithoutRequest<List<UserListItemDto>>
{
    public override void Configure()
    {
        Get("/api/users");
        Roles(AppRoles.Admin);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var users = userManager.Users.OrderBy(u => u.Email).ToList();
        var list = new List<UserListItemDto>(users.Count);
        foreach (var u in users)
        {
            var roles = await userManager.GetRolesAsync(u);
            var locked = await userManager.IsLockedOutAsync(u);
            string status;
            if (locked)
                status = "Locked";
            else if (!u.EmailConfirmed)
                status = "Inactive";
            else
                status = "Active";

            list.Add(new UserListItemDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email ?? string.Empty,
                Roles = roles.OrderBy(r => r).ToList(),
                Status = status,
                LastLoginAt = u.LastLoginAt
            });
        }

        await Send.OkAsync(list, ct);
    }
}
