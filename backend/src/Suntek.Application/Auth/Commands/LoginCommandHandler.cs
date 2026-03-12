using MediatR;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Auth.Commands;

public class LoginCommandHandler(IAuthService authService) : IRequestHandler<LoginCommand, AuthResult>
{
    public async Task<AuthResult> Handle(LoginCommand request, CancellationToken ct)
    {
        return await authService.LoginAsync(request.Email, request.Password, ct);
    }
}
