import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: 'Dashboard' }
      },
      {
        path: 'store-control',
        name: 'StoreControl',
        component: () => import('@/views/StoreControl.vue'),
        meta: { title: 'Store Control' }
      },
      {
        path: 'transformacion',
        name: 'Transformacion',
        component: () => import('@/views/Transformacion.vue'),
        meta: { title: 'Transformación' }
      },
      {
        path: 'integracion-sap',
        name: 'IntegracionSAP',
        component: () => import('@/views/IntegracionSAP.vue'),
        meta: { title: 'Integración SAP' }
      },
      {
        path: 'configuracion',
        name: 'Configuracion',
        component: () => import('@/views/Configuracion.vue'),
        meta: { title: 'Configuración' }
      },
      {
        path: 'auditoria',
        name: 'Auditoria',
        component: () => import('@/views/Auditoria.vue'),
        meta: { title: 'Auditoría' }
      },
      {
        path: 'soporte',
        name: 'Soporte',
        component: () => import('@/views/Soporte.vue'),
        meta: { title: 'Soporte Técnico' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

