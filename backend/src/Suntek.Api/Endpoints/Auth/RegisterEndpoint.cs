using FastEndpoints;
using MediatR;
using Suntek.Application.Auth.Commands;
using Suntek.Domain.Enums;

namespace Suntek.Api.Endpoints.Auth;

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    /// <summary>Optional role: Admin or Operator; defaults to Operator.</summary>
    public string? Role { get; set; }
}

public class RegisterResponse
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Message { get; set; } = "Registration successful.";
}

public class RegisterEndpoint(IMediator mediator) : Endpoint<RegisterRequest, RegisterResponse>
{
    public override void Configure()
    {
        Post("/api/auth/register");
        Roles(AppRoles.Admin);
    }

    public override async Task HandleAsync(RegisterRequest req, CancellationToken ct)
    {
        try
        {
            var result = await mediator.Send(new RegisterCommand(req.FullName, req.Email, req.Password, req.Role), ct);
            Response = new RegisterResponse
            {
                Id = result.Id,
                Email = result.Email,
                FullName = result.FullName,
                Message = result.Message
            };
            await Send.OkAsync(Response, ct);
        }
        catch (InvalidOperationException ex)
        {
            AddError(r => r.Email, ex.Message);
            ThrowIfAnyErrors();
        }
    }
}
