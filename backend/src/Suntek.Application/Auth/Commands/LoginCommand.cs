using MediatR;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Auth.Commands;

public record LoginCommand(string Email, string Password) : IRequest<AuthResult>;
