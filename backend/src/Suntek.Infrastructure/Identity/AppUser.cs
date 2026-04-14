using Microsoft.AspNetCore.Identity;

namespace Suntek.Infrastructure.Identity;

public class AppUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    /// <summary>UTC timestamp of the last successful login (for admin reporting).</summary>
    public DateTime? LastLoginAt { get; set; }
}
