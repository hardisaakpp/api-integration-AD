using System;
using System.DirectoryServices.AccountManagement;

namespace ActiveDirectory.Services
{
    public class AuthenticationService
    {
        private readonly string _domain;

        public AuthenticationService(string domain)
        {
            _domain = domain;
        }

        public bool AuthenticateUser(string username, string password)
        {
            try
            {
#if WINDOWS
#pragma warning disable CA1416
                using (PrincipalContext context = new PrincipalContext(ContextType.Domain, _domain))
                {
                    return context.ValidateCredentials(username, password);
                }
#pragma warning restore CA1416
#endif
            }
            catch (Exception)
            {
                return false;
            }
            return false;
        }
    }
}