<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data: {
    label: string
    type?: string
    target?: string
  }
}>()
</script>

<template>
  <div class="custom-node assert-node">
    <Handle type="target" :position="Position.Top" class="handle" />
    <div class="node-content">
      <div class="node-header">
        <span class="node-icon">✓</span>
        <span class="node-type">Assert</span>
      </div>
      <div class="node-label">{{ data.label }}</div>
      <div v-if="data.type" class="node-info">
        {{ data.type }}: {{ data.target }}
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
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
  box-shadow: 0 2px 8px rgba(230, 162, 60, 0.3);
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.handle {
  width: 8px;
  height: 8px;
  background: #e6a23c;
  border: 2px solid #fff;
}
</style>
