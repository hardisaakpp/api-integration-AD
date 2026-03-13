# Active Directory Sync - Documentación

## 📋 Descripción General

Aplicación de sincronización de usuarios entre **Active Directory (AD)** y una **base de datos SQL Server**. Permite mantener actualizada la tabla `usuarios_ad` con la información más reciente del directorio activo corporativo.

## 🎯 Funcionalidades Principales

- ✅ Conexión segura a Active Directory
- ✅ Extracción de usuarios del AD
- ✅ Sincronización bidireccional con SQL Server
- ✅ Inserción de nuevos usuarios
- ✅ Actualización de usuarios existentes
- ✅ Validación de conexiones
- ✅ Reportes detallados de sincronización

## 🏗️ Estructura del Proyecto

```
ActiveDirectory/
├── Helpers/
│   └── PasswordHelper.cs          # Utilidades de contraseñas
├── Models/
│   ├── UserAD.cs                  # Modelo de usuario AD
│   ├── UserDetails.cs             # Detalles del usuario
│   └── UserDetails.cs             # Información adicional del usuario
├── Services/
│   ├── ActiveDirectoryService.cs  # Conexión y consultas a AD
│   ├── AuthenticationService.cs   # Autenticación de usuarios
│   ├── DatabaseService.cs         # Operaciones en BD
│   └── README.md                  # Este archivo
```

## 🔧 Servicios Principales

### ActiveDirectoryService
**Responsabilidad:** Conexión y consultas al Active Directory

```csharp
public ActiveDirectoryService(string domain, string serverIp)
public bool TestConnection()          // Verifica conexión a AD
public List<UserDetails> GetAllUsers() // Obtiene todos los usuarios
```

**Propiedades extraídas del AD:**
- `objectGUID` - Identificador único del usuario
- `sAMAccountName` - Nombre de usuario
- `cn` - Nombre común
- `displayName` - Nombre para mostrar
- `mail` - Correo electrónico
- `telephoneNumber` - Teléfono
- `department` - Departamento
- `title` - Puesto
- `userAccountControl` - Estado de la cuenta

### DatabaseService
**Responsabilidad:** Operaciones CRUD en la base de datos

```csharp
public DatabaseService(string connectionString)
public bool TestConnection()                    // Verifica conexión a BD
public int ImportUsersToDatabase(List<UserDetails> usuarios) // Sincroniza usuarios
```

**Operaciones:**
- `InsertarUsuario()` - Crea nuevo registro de usuario
- `ActualizarUsuario()` - Actualiza datos del usuario existente
- `UsuarioExiste()` - Valida si el usuario ya existe

### AuthenticationService
**Responsabilidad:** Autenticación y validación de credenciales

```csharp
public bool AuthenticateUser(string username, string password) // Valida credenciales
```

## 🗄️ Estructura de la Base de Datos

### Tabla: `usuarios_ad`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_usuario` | INT (PK) | Identificador único (preservado) |
| `ad_guid` | VARCHAR(255) (UK) | GUID de Active Directory (preservado) |
| `usuario_ad` | VARCHAR(255) | Nombre de usuario de AD |
| `nombre_completo` | VARCHAR(255) | Nombre completo |
| `correo_electronico` | VARCHAR(255) | Email |
| `telefono` | VARCHAR(20) | Teléfono |
| `departamento` | VARCHAR(255) | Departamento |
| `puesto` | VARCHAR(255) | Puesto laboral |
| `estado_cuenta` | BIT | Estado activo/inactivo |
| `fecha_creacion` | DATETIME | Fecha de registro inicial |
| `usuario_creacion` | VARCHAR(255) | Usuario que creó registro |
| `fecha_modificacion` | DATETIME | Última actualización |
| `usuario_modificacion` | VARCHAR(255) | Usuario que modificó |
| `activo` | BIT | Indica si el registro está activo |

**Claves Importantes:**
- PK: `id_usuario` (no se actualiza)
- UK: `ad_guid` (preserva vinculación con AD)

## 📖 Flujo de Sincronización

```
START
  │
  ├─→ TestConnection (Active Directory)
  │
  ├─→ TestConnection (Database)
  │
  ├─→ GetAllUsers() desde AD
  │
  └─→ Para cada usuario:
      │
      ├─→ ¿Usuario existe en BD?
      │   ├─→ SÍ: ActualizarUsuario()
      │   └─→ NO: InsertarUsuario()
      │
      └─→ Incrementar contador
         (inserted_count o updated_count)
         
END (Mostrar resumen)
```

## ⚙️ Configuración

### Requisitos Previos

- .NET 6.0 o superior
- SQL Server 2016 o superior
- Acceso a Active Directory corporativo
- Credenciales con permisos de lectura en AD

### Parámetros de Conexión

```csharp
// Active Directory
var adService = new ActiveDirectoryService(
    domain: "empresa.local",
    serverIp: "192.168.1.10"
);

// Base de Datos
var dbService = new DatabaseService(
    connectionString: "Server=SERVER;Database=NOMBRE_BD;Integrated Security=true;"
);
```

## 🚀 Uso de la Aplicación

### 1. Verificar Conexiones

```csharp
var adService = new ActiveDirectoryService("empresa.local", "192.168.1.10");
var dbService = new DatabaseService(connectionString);

if (adService.TestConnection())
    Console.WriteLine("✅ Conectado a Active Directory");
else
    Console.WriteLine("❌ Error: No se pudo conectar a AD");

if (dbService.TestConnection())
    Console.WriteLine("✅ Conectado a Base de Datos");
else
    Console.WriteLine("❌ Error: No se pudo conectar a BD");
```

### 2. Sincronizar Usuarios

```csharp
// Obtener usuarios de AD
var usuarios = adService.GetAllUsers();

// Sincronizar con BD
int totalSincronizados = dbService.ImportUsersToDatabase(usuarios);

Console.WriteLine($"✅ Sincronización completada: {totalSincronizados} usuarios");
```

### 3. Autenticar Usuario

```csharp
var authService = new AuthenticationService("empresa.local", "192.168.1.10");

if (authService.AuthenticateUser("username", "password"))
    Console.WriteLine("✅ Autenticación exitosa");
else
    Console.WriteLine("❌ Credenciales inválidas");
```

## 📊 Reportes de Sincronización

La aplicación muestra un resumen detallado:

```
📋 Procesando XX usuarios desde Active Directory...
🔒 Conservando: id_usuario, ad_guid (identificadores únicos)
🔄 Sincronizando: datos actuales desde AD

✅ Usuarios nuevos insertados: XX
✅ Usuarios existentes sincronizados: XX
📅 Fecha de sincronización: 2026-02-23
```

## 🔐 Consideraciones de Seguridad

- ✅ Las claves primarias (`id_usuario`, `ad_guid`) nunca se modifican
- ✅ Se validan todas las conexiones antes de operaciones
- ✅ Se preservan los registros de auditoría (usuario_creacion, usuario_modificacion)
- ✅ Se mantiene historial de cambios con fechas de modificación
- ⚠️ Las credenciales deben almacenarse de forma segura (variables de entorno)

## 🐛 Manejo de Errores

Todos los servicios incluyen try-catch para:
- Fallos de conexión
- Usuarios no encontrados
- Datos inconsistentes
- Excepciones de base de datos

## 📝 Logs y Debugging

La aplicación muestra información en consola:

- `📋` - Información general
- `✅` - Operaciones exitosas
- `❌` - Errores
- `🔒` - Seguridad
- `🔄` - Sincronización
- `📅` - Fechas

## 🔄 Ciclo de Vida

1. **Inicialización** - Se configuran servicios y conexiones
2. **Validación** - Se verifica conectividad
3. **Extracción** - Se obtienen usuarios de AD
4. **Sincronización** - Se actualiza/inserta en BD
5. **Reporte** - Se muestra resumen de operaciones

## ❓ Preguntas Frecuentes

**P: ¿Qué datos se preservan en cada sincronización?**
A: Se preservan `id_usuario` y `ad_guid`. Todos los demás datos se actualizan desde AD.

**P: ¿Se eliminan usuarios si ya no existen en AD?**
A: No, se marcan como inactivos pero se conservan los registros históricos.

**P: ¿Con qué frecuencia debería sincronizar?**
A: Depende de la frecuencia de cambios en AD. Se recomienda diariamente.

**P: ¿Qué pasa si falla la sincronización a mitad del proceso?**
A: Se registra el error y continúa con los siguientes usuarios.

## 📞 Soporte y Mantenimiento

- Revisar logs de aplicación para errores
- Validar permisos de AD y SQL Server
- Verificar credenciales almacenadas
- Monitorear frecuencia de sincronizaciones

---

**Última actualización:** Febrero 23, 2026
**Versión:** 1.0
