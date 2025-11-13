# Guía de Instalación - MBA3-SAP Integrator Frontend

## Requisitos Previos

- Node.js 18+ y npm
- Backend API corriendo (puerto 8000 por defecto)

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno (opcional):
Crear archivo `.env` en la raíz del proyecto:
```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_TITLE=MBA3-SAP Integrator
```

3. Ejecutar en modo desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Build para Producción

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`

## Estructura del Proyecto

```
src/
├── assets/          # Recursos estáticos (imágenes, etc.)
├── components/      # Componentes reutilizables
│   ├── DataTable.vue
│   └── StatusBadge.vue
├── config/          # Configuración
├── layouts/         # Layouts de la aplicación
│   └── MainLayout.vue
├── router/          # Configuración de rutas
│   └── index.js
├── services/        # Servicios API
│   ├── api.js
│   ├── auditoriaService.js
│   ├── configuracionService.js
│   ├── dashboardService.js
│   ├── sapService.js
│   ├── storeControlService.js
│   └── transformacionService.js
├── stores/          # Stores de Pinia
│   ├── app.js
│   └── auth.js
├── styles/          # Estilos globales
│   └── main.scss
├── utils/           # Utilidades
│   ├── constants.js
│   └── formatters.js
├── views/           # Vistas/páginas
│   ├── Auditoria.vue
│   ├── Configuracion.vue
│   ├── Dashboard.vue
│   ├── IntegracionSAP.vue
│   ├── Login.vue
│   ├── Soporte.vue
│   ├── StoreControl.vue
│   └── Transformacion.vue
└── main.js          # Punto de entrada
```

## Características Implementadas

✅ Autenticación con JWT y roles
✅ Dashboard con métricas y gráficas
✅ Visualización de datos Store Control
✅ Transformación de facturas Rayo a ODC
✅ Integración y monitoreo SAP
✅ Configuración del sistema
✅ Auditoría y trazabilidad
✅ Soporte técnico

## Notas

- El frontend espera que el backend esté corriendo en `http://localhost:8000`
- Las rutas están protegidas según roles de usuario
- El modo oscuro se guarda en localStorage
- Los tokens JWT se almacenan en localStorage

