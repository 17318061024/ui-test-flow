<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{
  data: {
    label: string
    variable?: string
    operator?: string
    value?: string
  }
  selected?: boolean
}>()
</script>

<template>
  <div class="custom-node condition-node" :class="{ selected }">
    <Handle type="target" :position="Position.Top" class="handle" />
    <div class="node-content">
      <div class="node-header">
        <span class="node-icon">◇</span>
        <span class="node-type">Condition</span>
      </div>
      <div class="node-label">{{ data.label }}</div>
      <div v-if="data.variable" class="node-info">
        {{ data.variable }} {{ data.operator }} {{ data.value }}
      </div>
    </div>
    <!-- 左边连接点 - 条件为真 -->
    <Handle id="left" type="source" :position="Position.Left" class="handle handle-left" />
    <!-- 右边连接点 - 条件为假 -->
    <Handle id="right" type="source" :position="Position.Right" class="handle handle-right" />
  </div>
</template>

<style scoped>
.custom-node {
  padding: 12px 16px;
  border-radius: 8px;
  color: #333;
  font-size: 14px;
  min-width: 160px;
  background: linear-gradient(135deg, #f0c020 0%, #f7d053 100%);
  box-shadow: 0 2px 8px rgba(240, 192, 32, 0.3);
  border: 2px solid transparent;
  transition: all 0.2s;
}

.custom-node.selected {
  border-color: #fff;
  box-shadow: 0 0 0 3px rgba(240, 192, 32, 0.5), 0 4px 12px rgba(240, 192, 32, 0.4);
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
  opacity: 0.7;
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
  background: #f0c020;
  border: 2px solid #fff;
}

.handle-left {
  left: -4px !important;
  top: 50% !important;
  transform: translateY(-50%);
}

.handle-right {
  right: -4px !important;
  top: 50% !important;
  transform: translateY(-50%);
}
</style>
