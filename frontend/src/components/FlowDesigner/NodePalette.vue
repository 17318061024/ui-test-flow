<script setup lang="ts">
import { useFlowStore } from '@/stores/flow'
import type { NodeType } from '@/types/flow'

const flowStore = useFlowStore()

interface NodeItem {
  type: NodeType
  label: string
  icon: string
}

const nodeItems: NodeItem[] = [
  { type: 'Action', label: '执行操作', icon: '⚡' },
  { type: 'Assert', label: '断言验证', icon: '✓' },
  { type: 'Extract', label: '数据提取', icon: '↗' },
  { type: 'Condition', label: '条件分支', icon: '◇' },
  { type: 'SubFlow', label: '子流程', icon: '⤵' },
  { type: 'End', label: '结束', icon: '■' }
]

function onDragStart(event: DragEvent, nodeType: NodeType) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }
}
</script>

<template>
  <div class="flow-designer-palette">
    <div class="palette-title">节点面板</div>
    <div class="palette-hint">拖拽节点到画布</div>

    <div
      v-for="item in nodeItems"
      :key="item.type"
      class="palette-item"
      draggable="true"
      @dragstart="(e) => onDragStart(e, item.type)"
    >
      <div :class="['palette-icon', item.type.toLowerCase()]">
        {{ item.icon }}
      </div>
      <span class="palette-label">{{ item.label }}</span>
    </div>

    <div class="palette-divider"></div>

    <div class="palette-section-title">已添加的节点</div>
    <div class="node-list">
      <div
        v-for="node in flowStore.currentFlow?.nodes"
        :key="node.id"
        class="node-list-item"
        :class="{ selected: flowStore.selectedNode?.id === node.id }"
        @click="flowStore.selectNode(node)"
      >
        <span :class="['node-badge', node.type.toLowerCase()]">
          {{ node.type.charAt(0) }}
        </span>
        <span class="node-name">{{ node.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.palette-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.palette-hint {
  font-size: 12px;
  color: #909399;
  margin-bottom: 16px;
}

.palette-divider {
  height: 1px;
  background: #e4e7ed;
  margin: 16px 0;
}

.palette-section-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.node-list-item:hover {
  background: #f5f7fa;
}

.node-list-item.selected {
  background: #ecf5ff;
  color: #409eff;
}

.node-badge {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #fff;
}

.node-badge.start { background: #67c23a; }
.node-badge.end { background: #f56c6c; }
.node-badge.action { background: #409eff; }
.node-badge.assert { background: #e6a23c; }
.node-badge.extract { background: #9b59b6; }
.node-badge.condition { background: #f0c020; color: #333; }
.node-badge.subflow { background: #00bcd4; }

.node-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
