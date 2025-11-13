# Scripts de Consola - MBA3 Client

Scripts de Node.js para interactuar con MBA3 desde la línea de comandos.

## 📋 Requisitos

- Node.js 18+ 
- Archivo `.env` configurado con las credenciales de MBA3

## ⚙️ Configuración

1. Copia `.env.example` a `.env` en la raíz del proyecto:
```bash
cp .env.example .env
```

2. Edita `.env` y completa las variables:
```env
MBA3_BASE_URL=https://tu-servidor.mba3.com
MBA3_CODIGO=tu_codigo_servicio
MBA3_PWD=tu_contraseña_servicio
```

## 🚀 Uso

### Obtener Token JWT

Ejecuta el script para obtener un token JWT de MBA3:

```bash
npm run get-token
```

El script:
- Se conecta al servidor MBA3 usando las credenciales del `.env`
- Realiza el login y obtiene el JWT
- Muestra el token en la consola
- Retorna código de salida 0 si es exitoso, 1 si hay error

**Ejemplo de salida exitosa:**
```
============================================================
PASO 1: Creando LOGIN para obtener JWT (sesión)
============================================================
2024-01-01T12:00:00.000Z - INFO    - Cliente MBA3 inicializado con URL: https://...
2024-01-01T12:00:00.000Z - INFO    - Intentando login con código: ABC***
...

============================================================
✅ LOGIN EXITOSO - JWT (sesión) obtenido
============================================================

JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

⚠️  IMPORTANTE: Almacena este JWT para usarlo en tus peticiones.
   El JWT tiene un tiempo de expiración limitado.
   Si expira, deberás realizar un nuevo LOGIN.
```

## 📁 Archivos

- **`mba3Client.js`** - Cliente MBA3 reutilizable
  - Clase `MBA3Client` para interactuar con MBA3
  - Método `login(codigo, pwd)` para obtener JWT
  - Método `isLoggedIn()` para verificar sesión activa

- **`getToken.js`** - Script principal para obtener token
  - Lee configuración desde `.env`
  - Usa `MBA3Client` para realizar login
  - Muestra resultados en consola

## 🔧 Uso Programático

Puedes importar y usar `MBA3Client` en otros scripts:

```javascript
import MBA3Client from './scripts/mba3Client.js'
import dotenv from 'dotenv'

dotenv.config()

const client = new MBA3Client(process.env.MBA3_BASE_URL)
const token = await client.login(process.env.MBA3_CODIGO, process.env.MBA3_PWD)
console.log('Token obtenido:', token)
```

## ❌ Manejo de Errores

El script maneja varios tipos de errores:

- **Error 005**: Servicio no configurado en MBA3
- **401**: Credenciales inválidas
- **403**: IP bloqueada
- **429**: Demasiadas peticiones
- **Timeout**: Servidor no responde

Todos los errores muestran mensajes descriptivos con instrucciones para resolverlos.

## 🔄 Migración desde Python

Este código es equivalente a la versión Python original:
- Misma lógica de login
- Mismo manejo de errores
- Mismos mensajes de ayuda
- Compatible con la misma configuración de MBA3

