using FastEndpoints;
using MediatR;
using Suntek.Application.Auth.Commands;
namespace Suntek.Api.Endpoints.Auth;

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string[] Roles { get; set; } = [];
    public DateTime ExpiresAt { get; set; }
}

public class LoginEndpoint(IMediator mediator) : Endpoint<LoginRequest, LoginResponse>
{
    public override void Configure()
    {
        Post("/api/auth/login");
        AllowAnonymous();
    }

    public override async Task HandleAsync(LoginRequest req, CancellationToken ct)
    {
        try
        {
            var result = await mediator.Send(new LoginCommand(req.Email, req.Password), ct);
            Response = new LoginResponse
            {
                Token = result.Token,
                Email = result.Email,
                Roles = result.Roles,
                ExpiresAt = result.ExpiresAt
            };
            await Send.OkAsync(Response, ct);
        }
        catch (UnauthorizedAccessException)
        {
            ThrowError("Invalid email or password.", statusCode: 401);
        }
    }
}
