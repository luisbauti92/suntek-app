namespace Suntek.Domain.Interfaces;

public record AuthResult(
    string Token,
    string Email,
    string[] Roles,
    DateTime ExpiresAt);

public record RegisterResult(
    string Id,
    string Email,
    string FullName,
    string Message);

public interface IAuthService
{
    Task<AuthResult> LoginAsync(string email, string password, CancellationToken ct = default);
    Task<RegisterResult> RegisterAsync(string fullName, string email, string password, string? role, CancellationToken ct = default);
}
