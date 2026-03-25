<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data: {
    label: string
    loopType?: string
    times?: number
  }
}>()
</script>

<template>
  <div class="custom-node loop-node">
    <Handle type="target" :position="Position.Top" class="handle" />
    <div class="node-content">
      <div class="node-header">
        <span class="node-icon">🔁</span>
        <span class="node-type">Loop</span>
      </div>
      <div class="node-label">{{ data.label }}</div>
      <div v-if="data.loopType" class="node-info">
        {{ data.loopType }}{{ data.times ? `: ${data.times}次` : '' }}
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
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
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
  background: #67c23a;
  border: 2px solid #fff;
}
</style>
