<script setup lang="ts">
import { RouterView, RouterLink, useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <div class="app-logo">UI 测试流程设计器</div>
      <nav class="app-menu">
        <RouterLink to="/" :class="{ active: route.path === '/' }">流程列表</RouterLink>
        <RouterLink to="/designer" :class="{ active: route.path.startsWith('/designer') }">流程设计器</RouterLink>
        <RouterLink to="/test-cases" :class="{ active: route.path === '/test-cases' }">用例预览</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>
