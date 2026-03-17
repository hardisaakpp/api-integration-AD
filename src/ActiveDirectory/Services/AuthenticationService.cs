using System;
using System.DirectoryServices.AccountManagement;

namespace ActiveDirectory.Services
{
    public class AuthenticationService
    {
        private readonly string _domain;
        private readonly string? _serverIp;
        private readonly string? _bindUser;
        private readonly string? _bindPassword;

        public AuthenticationService(string domain, string? serverIp = null, string? bindUser = null, string? bindPassword = null)
        {
            _domain = domain;
            _serverIp = string.IsNullOrWhiteSpace(serverIp) ? null : serverIp;
            _bindUser = string.IsNullOrWhiteSpace(bindUser) ? null : bindUser;
            _bindPassword = string.IsNullOrWhiteSpace(bindPassword) ? null : bindPassword;
        }

        public bool AuthenticateUser(string username, string password)
        {
            try
            {
#if WINDOWS
#pragma warning disable CA1416
                using (PrincipalContext context = CreatePrincipalContext())
                {
                    return context.ValidateCredentials(username, password);
                }
#pragma warning restore CA1416
#else
                return false;
#endif
            }
            catch (Exception)
            {
                return false;
            }
        }

#if WINDOWS
#pragma warning disable CA1416
        private PrincipalContext CreatePrincipalContext()
        {
            if (_bindUser != null && _bindPassword != null)
            {
                return new PrincipalContext(ContextType.Domain, _domain, _serverIp, _bindUser, _bindPassword);
            }

            return new PrincipalContext(ContextType.Domain, _domain, _serverIp);
        }
#pragma warning restore CA1416
#endif
    }
}