using MediatR;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Auth.Commands;

public class RegisterCommandHandler(IAuthService authService) : IRequestHandler<RegisterCommand, RegisterResult>
{
    public async Task<RegisterResult> Handle(RegisterCommand request, CancellationToken ct)
    {
        return await authService.RegisterAsync(request.FullName, request.Email, request.Password, ct);
    }
}
