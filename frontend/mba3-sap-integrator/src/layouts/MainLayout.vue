<template>
  <div class="main-layout">
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <h2 v-if="!sidebarCollapsed">MBA3-SAP</h2>
        <button class="sidebar-toggle" @click="toggleSidebar">
          <span v-if="sidebarCollapsed">☰</span>
          <span v-else>✕</span>
        </button>
      </div>
      <nav class="sidebar-nav">
        <router-link 
          v-for="item in menuItems" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: $route.path === item.path }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span v-if="!sidebarCollapsed" class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <button 
          class="dark-mode-toggle" 
          @click="toggleDarkMode" 
          :title="isDarkMode ? 'Modo claro' : 'Modo oscuro'"
          :aria-label="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
        >
          <span class="dark-mode-icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
          <span v-if="!sidebarCollapsed" class="dark-mode-label">
            {{ isDarkMode ? 'Modo Claro' : 'Modo Oscuro' }}
          </span>
        </button>
      </div>
    </aside>
    <main class="main-content">
      <header class="topbar">
        <h1 class="page-title">{{ currentPageTitle }}</h1>
        <div class="topbar-actions">
          <button 
            class="btn btn-outline"
            @click="$router.push('/soporte')"
          >
            🧩 Soporte
          </button>
        </div>
      </header>
      <div class="content-wrapper">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

const sidebarCollapsed = ref(false)
const isDarkMode = computed(() => appStore.isDarkMode)

const currentPageTitle = computed(() => {
  return router.currentRoute.value.meta?.title || 'Dashboard'
})

const menuItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/store-control', label: 'Store Control', icon: '📄' },
  { path: '/transformacion', label: 'Transformación', icon: '🔄' },
  { path: '/integracion-sap', label: 'Integración SAP', icon: '🔗' },
  { path: '/auditoria', label: 'Auditoría', icon: '🧾' },
  { path: '/configuracion', label: 'Configuración', icon: '⚙️' },
  { path: '/consultas-mba3', label: 'Consultas MBA3', icon: '🔍' }
]

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

function toggleDarkMode() {
  appStore.toggleDarkMode()
}
</script>

<style lang="scss" scoped>
.main-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  background: var(--bg-color);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: fixed;
  height: 100vh;
  overflow-y: auto;

  &.collapsed {
    width: 70px;
  }
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--primary-color);
  }
}

.sidebar-toggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  color: var(--text-color);
  padding: 0.25rem;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.2s;
  gap: 0.75rem;

  &:hover {
    background: var(--bg-secondary);
  }

  &.active {
    background: rgba(59, 130, 246, 0.1);
    color: var(--primary-color);
    border-right: 3px solid var(--primary-color);
  }
}

.nav-icon {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
}

.nav-label {
  font-weight: 500;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
}

.dark-mode-toggle {
  width: 100%;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  color: var(--text-color);

  &:hover {
    background: var(--bg-color);
    border-color: var(--primary-color);
    transform: translateY(-1px);
    box-shadow: var(--shadow);
  }

  &:active {
    transform: translateY(0);
  }
}

.dark-mode-icon {
  font-size: 1.25rem;
  transition: transform 0.3s ease;
}

.dark-mode-toggle:hover .dark-mode-icon {
  transform: scale(1.1);
}

.dark-mode-label {
  font-weight: 500;
  font-size: 0.875rem;
}

.main-content {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;

  .sidebar.collapsed ~ & {
    margin-left: 70px;
  }
}

.topbar {
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
}

.topbar-actions {
  display: flex;
  gap: 0.5rem;
}

.content-wrapper {
  flex: 1;
  padding: 2rem;
}
</style>

