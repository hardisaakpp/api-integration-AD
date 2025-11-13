# MBA3-SAP Integrator Frontend

Frontend desarrollado con Vue.js para la integración entre MBA3 y SAP, permitiendo la generación de ODC (Órdenes de Compra) desde despachos Rayo.

## 🚀 Características

- 📄 Visualización y gestión de datos del Store Control
- ⚙️ Transformación de despachos Rayo a ODC
- 🔗 Monitoreo de integración con SAP
- 📊 Dashboard con métricas y estadísticas
- 🧾 Auditoría y trazabilidad de operaciones
- ⚙️ Configuración de parámetros del sistema
- 🧩 Interfaz moderna y responsive

## 📦 Instalación

```bash
npm install
```

## 🏃 Desarrollo

```bash
npm run dev
```

## 🏗️ Build

```bash
npm run build
```

## 🛠️ Tecnologías

- Vue 3 (Composition API)
- Vue Router 4
- Pinia (State Management)
- Axios (HTTP Client)
- Chart.js (Gráficas)
- Vite (Build Tool)
- Sass (Estilos)

## 📁 Estructura del Proyecto

```
src/
├── assets/          # Recursos estáticos
├── components/      # Componentes reutilizables
├── views/          # Vistas/páginas
├── router/         # Configuración de rutas (sin protección de autenticación)
├── stores/         # Stores de Pinia (app.js para configuración general)
├── services/       # Servicios API
├── utils/          # Utilidades
├── styles/         # Estilos globales
└── main.js         # Punto de entrada
```

## 🔑 Scripts de Consola

El proyecto incluye scripts de Node.js para trabajar con MBA3 desde la línea de comandos:

### Obtener Token JWT

```bash
npm run get-token
```

Este script obtiene un token JWT de MBA3 usando las credenciales configuradas en `.env`.

**Configuración requerida en `.env`:**
```env
MBA3_BASE_URL=https://tu-servidor.mba3.com
MBA3_CODIGO=tu_codigo_servicio
MBA3_PWD=tu_contraseña_servicio
```

Copia `.env.example` a `.env` y completa los valores.

**Archivos relacionados:**
- `scripts/mba3Client.js` - Cliente MBA3 para Node.js
- `scripts/getToken.js` - Script para obtener token JWT

## ⚠️ Nota sobre Autenticación

La autenticación ha sido removida del proyecto. Todas las rutas son accesibles sin necesidad de login. Si necesitas agregar autenticación en el futuro, puedes restaurar los archivos:
- `src/stores/auth.js` (store de autenticación)
- `src/views/Login.vue` (vista de login)

