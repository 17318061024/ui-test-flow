<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data: {
    label: string
  }
}>()
</script>

<template>
  <div class="custom-node start-node">
    <Handle type="source" :position="Position.Bottom" class="custom-handle" />
    <div class="node-content">
      <span class="node-icon">▶</span>
      <span class="node-label">{{ data.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.custom-node {
  padding: 12px 20px;
  border-radius: 20px;
  background: #67c23a;
  color: white;
  font-size: 14px;
  font-weight: 500;
  min-width: 100px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
}

.start-node {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.node-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.node-icon {
  font-size: 12px;
}

.node-label {
  font-size: 14px;
}

.custom-handle {
  width: 10px;
  height: 10px;
  background: #67c23a;
  border: 2px solid #fff;
}
</style>
