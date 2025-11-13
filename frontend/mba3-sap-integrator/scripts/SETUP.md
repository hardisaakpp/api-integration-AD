# Configuración Rápida - Scripts MBA3

## 📝 Paso 1: Crear archivo .env

En la raíz del proyecto, crea un archivo `.env` con el siguiente contenido:

```env
MBA3_BASE_URL=http://192.168.2.159:8081
MBA3_CODIGO=CDB002
MBA3_PWD=88888
```

**Importante:** 
- Reemplaza los valores con tus credenciales reales si son diferentes
- El archivo `.env` está en `.gitignore` y NO se subirá al repositorio
- No compartas tus credenciales en el código

## 🚀 Paso 2: Ejecutar el script

```bash
npm run get-token
```

## ✅ Verificación

Si todo está correcto, deberías ver:

```
============================================================
PASO 1: Creando LOGIN para obtener JWT (sesión)
============================================================
...
============================================================
✅ LOGIN EXITOSO - JWT (sesión) obtenido
============================================================

JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ❌ Solución de Problemas

### Error: "Falta configurar variables de entorno"
- Verifica que el archivo `.env` existe en la raíz del proyecto
- Verifica que las variables tienen exactamente estos nombres: `MBA3_BASE_URL`, `MBA3_CODIGO`, `MBA3_PWD`
- No debe haber espacios antes o después del `=`

### Error 005: "No existe configuración de Servicio WEB"
- Verifica en MBA3 que el servicio con código `CDB002` está configurado
- Verifica que la contraseña es exactamente `88888`
- Verifica que el servicio está ACTIVO
- Verifica que el servicio es de tipo 'Consultas Externas' o 'API'

### Error de conexión
- Verifica que el servidor MBA3 está corriendo en `http://192.168.2.159:8081`
- Verifica que puedes acceder a esa URL desde tu máquina
- Verifica que no hay firewall bloqueando la conexión

