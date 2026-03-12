using MediatR;
using Suntek.Domain.Interfaces;

namespace Suntek.Application.Auth.Commands;

public record RegisterCommand(string FullName, string Email, string Password) : IRequest<RegisterResult>;
