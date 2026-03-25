<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data: {
    label: string
  }
  selected?: boolean
}>()
</script>

<template>
  <div class="custom-node end-node" :class="{ selected }">
    <Handle type="target" :position="Position.Top" class="custom-handle" />
    <div class="node-content">
      <span class="node-icon">■</span>
      <span class="node-label">{{ data.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.custom-node {
  padding: 12px 20px;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  min-width: 100px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.end-node {
  background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.3);
}

.custom-node.selected {
  border-color: #fff;
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.5), 0 4px 12px rgba(245, 108, 108, 0.4);
  transform: scale(1.02);
}

.node-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.node-icon {
  font-size: 10px;
}

.node-label {
  font-size: 14px;
}

.custom-handle {
  width: 10px;
  height: 10px;
  background: #f56c6c;
  border: 2px solid #fff;
}
</style>
