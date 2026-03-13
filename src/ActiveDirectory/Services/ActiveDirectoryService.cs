using System;
using System.Collections.Generic;
using System.DirectoryServices;
using System.DirectoryServices.AccountManagement;
using ActiveDirectory.Models;

namespace ActiveDirectory.Services
{
    public class ActiveDirectoryService
    {
        private readonly string _domain;
        private readonly string _serverIp;

        public ActiveDirectoryService(string domain, string serverIp)
        {
            _domain = domain;
            _serverIp = serverIp;
        }

        public bool TestConnection()
        {
            try
            {
#if WINDOWS
#pragma warning disable CA1416
                using (PrincipalContext context = new PrincipalContext(ContextType.Domain, _domain))
                {
                    return !string.IsNullOrEmpty(context.Name);
                }
#pragma warning restore CA1416
#else
                // No implementado en otras plataformas
                return false;
#endif
            }
            catch
            {
                return false;
            }
        }

        public List<UserDetails> GetAllUsers()
        {
            var usuarios = new List<UserDetails>();
            try
            {
#if WINDOWS
#pragma warning disable CA1416
                DirectoryEntry entry = new DirectoryEntry($"LDAP://{_serverIp}");
                DirectorySearcher searcher = new DirectorySearcher(entry);
                searcher.Filter = "(&(objectClass=user)(objectCategory=person))";
                // Propiedades que queremos obtener
                searcher.PropertiesToLoad.Add("objectGUID");
                searcher.PropertiesToLoad.Add("sAMAccountName");
                searcher.PropertiesToLoad.Add("cn");
                searcher.PropertiesToLoad.Add("displayName");
                searcher.PropertiesToLoad.Add("mail");
                searcher.PropertiesToLoad.Add("telephoneNumber");
                searcher.PropertiesToLoad.Add("department");
                searcher.PropertiesToLoad.Add("title");
                searcher.PropertiesToLoad.Add("lastLogon");
                searcher.PropertiesToLoad.Add("userAccountControl");

                SearchResultCollection results = searcher.FindAll();

                foreach (SearchResult result in results)
                {
                    var user = new UserDetails
                    {
                        Guid = GetPropertyValue(result, "objectGUID"),
                        Username = GetPropertyValue(result, "sAMAccountName"),
                        DisplayName = GetPropertyValue(result, "displayName") ?? GetPropertyValue(result, "cn"),
                        Email = GetPropertyValue(result, "mail"),
                        Phone = GetPropertyValue(result, "telephoneNumber"),
                        Department = GetPropertyValue(result, "department"),
                        Title = GetPropertyValue(result, "title"),
                        LastLogon = GetLastLogonDate(result),
                        Enabled = IsAccountEnabled(result)
                    };
                    usuarios.Add(user);
                }
#pragma warning restore CA1416
#endif
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al listar usuarios: {ex.Message}");
            }
            return usuarios;
        }

        public UserDetails GetUserDetails(string username)
        {
            try
            {
#if WINDOWS
#pragma warning disable CA1416
                using (PrincipalContext context = new PrincipalContext(ContextType.Domain, _domain))
                {
                    UserPrincipal userPrincipal = UserPrincipal.FindByIdentity(context, username);
                    if (userPrincipal != null)
                    {
                        // Obtener información adicional del DirectoryEntry
                        DirectoryEntry de = (DirectoryEntry)userPrincipal.GetUnderlyingObject();

                        return new UserDetails
                        {
                            Guid = userPrincipal.Guid?.ToString() ?? string.Empty,
                            Username = userPrincipal.SamAccountName ?? string.Empty,
                            DisplayName = userPrincipal.DisplayName ?? string.Empty,
                            Email = userPrincipal.EmailAddress ?? string.Empty,
                            LastLogon = userPrincipal.LastLogon,
                            Enabled = userPrincipal.Enabled,
                            Department = GetDirectoryProperty(de, "department") ?? string.Empty,
                            Title = GetDirectoryProperty(de, "title") ?? string.Empty,
                            Phone = GetDirectoryProperty(de, "telephoneNumber") ?? string.Empty
                        };
                    }
                }
#pragma warning restore CA1416
#endif
            }
            catch (Exception)
            {
                // Silenciar errores para mantener compatibilidad
            }
            // Retorna un objeto vacío para evitar advertencia de null reference
            return new UserDetails
            {
                Guid = string.Empty,
                Username = string.Empty,
                DisplayName = string.Empty,
                Email = string.Empty,
                LastLogon = null,
                Enabled = null,
                Department = string.Empty,
                Title = string.Empty,
                Phone = string.Empty
            };
        }

        public void ListUsers()
        {
            try
            {
                var usuarios = GetAllUsers();
                Console.WriteLine("Usuarios encontrados:");

                foreach (var user in usuarios)
                {
                    Console.WriteLine($"- {user.DisplayName} ({user.Username}) - {user.Email}");
                }

                Console.WriteLine($"\nTotal: {usuarios.Count} usuarios");
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ Error al listar usuarios: " + ex.Message);
            }
        }

        public bool ValidateUserCredentials(string username, string password)
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
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error de validación: {ex.Message}");
            }
            return false;
        }

        private string GetPropertyValue(SearchResult result, string propertyName)
        {
#if WINDOWS
#pragma warning disable CA1416
            if (result.Properties[propertyName].Count > 0)
            {
                if (propertyName == "objectGUID")
                {
                    byte[] guidBytes = result.Properties[propertyName][0] as byte[];
                    return guidBytes != null ? new Guid(guidBytes).ToString() : string.Empty;
                }
                return result.Properties[propertyName][0]?.ToString() ?? string.Empty;
            }
#pragma warning restore CA1416
#endif
            return string.Empty;
        }

        private DateTime? GetLastLogonDate(SearchResult result)
        {
            try
            {
#if WINDOWS
#pragma warning disable CA1416
                if (result.Properties["lastLogon"].Count > 0)
                {
                    object value = result.Properties["lastLogon"][0];
                    if (value != null && value is long lastLogon && lastLogon > 0)
                    {
                        return DateTime.FromFileTime(lastLogon);
                    }
                }
#pragma warning restore CA1416
#endif
            }
            catch { }
            return null;
        }

        private bool? IsAccountEnabled(SearchResult result)
        {
            try
            {
#if WINDOWS
#pragma warning disable CA1416
                if (result.Properties["userAccountControl"].Count > 0)
                {
                    object value = result.Properties["userAccountControl"][0];
                    if (value != null && value is int userAccountControl)
                    {
                        return (userAccountControl & 0x2) == 0; // 0x2 = ACCOUNTDISABLE
                    }
                }
#pragma warning restore CA1416
#endif
            }
            catch { }
            return null;
        }

        private string GetProperty(SearchResult result, string propertyName)
        {
#if WINDOWS
#pragma warning disable CA1416
            return result.Properties[propertyName].Count > 0
                ? result.Properties[propertyName][0]?.ToString() ?? "N/A"
                : "N/A";
#pragma warning restore CA1416
#else
            return "N/A";
#endif
        }

        private string GetDirectoryProperty(DirectoryEntry de, string propertyName)
        {
            try
            {
#if WINDOWS
#pragma warning disable CA1416
                var value = de.Properties[propertyName]?.Value;
                if (value != null)
                {
                    return value.ToString();
                }
#pragma warning restore CA1416
#endif
            }
            catch (Exception)
            {
                // Silenciar errores
            }
            return string.Empty;
        }
    }
}