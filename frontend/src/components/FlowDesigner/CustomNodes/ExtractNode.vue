<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data: {
    label: string
    target?: string
    as?: string
  }
  selected?: boolean
}>()
</script>

<template>
  <div class="custom-node extract-node" :class="{ selected }">
    <Handle type="target" :position="Position.Top" class="handle" />
    <div class="node-content">
      <div class="node-header">
        <span class="node-icon">↗</span>
        <span class="node-type">Extract</span>
      </div>
      <div class="node-label">{{ data.label }}</div>
      <div v-if="data.as" class="node-info">
        → {{ data.as }}
      </div>
    </div>
    <Handle type="source" :position="Position.Bottom" class="handle" />
  </div>
</template>

<style scoped>
.custom-node {
  padding: 12px 16px;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  min-width: 160px;
  background: linear-gradient(135deg, #9b59b6 0%, #b07cc6 100%);
  box-shadow: 0 2px 8px rgba(155, 89, 182, 0.3);
  border: 2px solid transparent;
  transition: all 0.2s;
}

.custom-node.selected {
  border-color: #fff;
  box-shadow: 0 0 0 3px rgba(155, 89, 182, 0.5), 0 4px 12px rgba(155, 89, 182, 0.4);
  transform: scale(1.02);
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.node-icon {
  font-size: 12px;
}

.node-type {
  font-size: 10px;
  opacity: 0.8;
  text-transform: uppercase;
}

.node-label {
  font-weight: 500;
  font-size: 14px;
}

.node-info {
  font-size: 11px;
  opacity: 0.8;
}

.handle {
  width: 8px;
  height: 8px;
  background: #9b59b6;
  border: 2px solid #fff;
}
</style>
