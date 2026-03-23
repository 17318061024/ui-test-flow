<script setup lang="ts">
import { useFlowStore } from '@/stores/flow'
import { computed } from 'vue'
import type { NodeType } from '@/types/flow'

const flowStore = useFlowStore()

/**
 * 节点面板项定义
 * 从用户角度按动作类型分类
 */
interface NodeItem {
  type: NodeType
  label: string
  icon: string
  category: string  // 用户视角的分类
  description: string // 节点描述
}

/**
 * 简化的节点列表
 * 所有节点都支持语义化描述
 */
const nodeItems: NodeItem[] = [
  // 流程控制
  { type: 'Start', label: '开始', icon: '▶', category: 'flow', description: '流程开始节点' },
  { type: 'End', label: '结束', icon: '■', category: 'flow', description: '流程结束节点' },
  // 页面操作
  { type: 'Navigate', label: '打开页面', icon: '🌐', category: 'page', description: '导航到指定页面，支持语义化描述' },
  { type: 'Action', label: '执行操作', icon: '👆', category: 'action', description: '点击、输入、选择等操作，支持语义化描述' },
  { type: 'Wait', label: '等待', icon: '⏱', category: 'page', description: '等待页面加载或元素出现，支持语义化描述' },
  // 验证与数据
  { type: 'Assert', label: '验证', icon: '✓', category: 'verify', description: '验证页面状态，支持语义化描述' },
  { type: 'Extract', label: '提取数据', icon: '↗', category: 'data', description: '从页面提取数据，支持语义化描述' },
  // 流程逻辑
  { type: 'Condition', label: '条件分支', icon: '◇', category: 'logic', description: '根据条件分支执行，支持语义化描述' },
  { type: 'SubFlow', label: '子流程', icon: '⤵', category: 'logic', description: '调用其他测试流程' }
]

/**
 * 开始拖拽节点
 */
function onDragStart(event: DragEvent, nodeType: NodeType) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }
}

// 按分类筛选节点
const flowNodes = computed(() => nodeItems.filter(n => n.category === 'flow'))
const pageNodes = computed(() => nodeItems.filter(n => n.category === 'page'))
const actionNodes = computed(() => nodeItems.filter(n => n.category === 'action'))
const verifyNodes = computed(() => nodeItems.filter(n => n.category === 'verify'))
const dataNodes = computed(() => nodeItems.filter(n => n.category === 'data'))
const logicNodes = computed(() => nodeItems.filter(n => n.category === 'logic'))
</script>

<template>
  <div class="flow-designer-palette">
    <div class="palette-title">节点面板</div>
    <div class="palette-hint">拖拽节点到画布，用自然语言描述操作</div>

    <!-- 流程控制 -->
    <div class="palette-section-title">流程控制</div>
    <div
      v-for="item in flowNodes"
      :key="item.type"
      class="palette-item"
      draggable="true"
      @dragstart="(e) => onDragStart(e, item.type)"
    >
      <div :class="['palette-icon', item.type.toLowerCase()]">
        {{ item.icon }}
      </div>
      <div class="palette-item-content">
        <span class="palette-label">{{ item.label }}</span>
        <span class="palette-desc">{{ item.description }}</span>
      </div>
    </div>

    <!-- 页面操作 -->
    <div class="palette-section-title">页面操作</div>
    <div
      v-for="item in pageNodes"
      :key="item.type"
      class="palette-item"
      draggable="true"
      @dragstart="(e) => onDragStart(e, item.type)"
    >
      <div :class="['palette-icon', item.type.toLowerCase()]">
        {{ item.icon }}
      </div>
      <div class="palette-item-content">
        <span class="palette-label">{{ item.label }}</span>
        <span class="palette-desc">{{ item.description }}</span>
      </div>
    </div>

    <!-- 执行操作 -->
    <div class="palette-section-title">执行操作</div>
    <div
      v-for="item in actionNodes"
      :key="item.type"
      class="palette-item"
      draggable="true"
      @dragstart="(e) => onDragStart(e, item.type)"
    >
      <div :class="['palette-icon', item.type.toLowerCase()]">
        {{ item.icon }}
      </div>
      <div class="palette-item-content">
        <span class="palette-label">{{ item.label }}</span>
        <span class="palette-desc">{{ item.description }}</span>
      </div>
    </div>

    <!-- 验证 -->
    <div class="palette-section-title">验证</div>
    <div
      v-for="item in verifyNodes"
      :key="item.type"
      class="palette-item"
      draggable="true"
      @dragstart="(e) => onDragStart(e, item.type)"
    >
      <div :class="['palette-icon', item.type.toLowerCase()]">
        {{ item.icon }}
      </div>
      <div class="palette-item-content">
        <span class="palette-label">{{ item.label }}</span>
        <span class="palette-desc">{{ item.description }}</span>
      </div>
    </div>

    <!-- 数据 -->
    <div class="palette-section-title">数据提取</div>
    <div
      v-for="item in dataNodes"
      :key="item.type"
      class="palette-item"
      draggable="true"
      @dragstart="(e) => onDragStart(e, item.type)"
    >
      <div :class="['palette-icon', item.type.toLowerCase()]">
        {{ item.icon }}
      </div>
      <div class="palette-item-content">
        <span class="palette-label">{{ item.label }}</span>
        <span class="palette-desc">{{ item.description }}</span>
      </div>
    </div>

    <!-- 流程逻辑 -->
    <div class="palette-section-title">流程逻辑</div>
    <div
      v-for="item in logicNodes"
      :key="item.type"
      class="palette-item"
      draggable="true"
      @dragstart="(e) => onDragStart(e, item.type)"
    >
      <div :class="['palette-icon', item.type.toLowerCase()]">
        {{ item.icon }}
      </div>
      <div class="palette-item-content">
        <span class="palette-label">{{ item.label }}</span>
        <span class="palette-desc">{{ item.description }}</span>
      </div>
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

.palette-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  margin-bottom: 6px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s;
}

.palette-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.palette-item:active {
  cursor: grabbing;
}

.palette-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border-radius: 6px;
  background: #f5f7fa;
  flex-shrink: 0;
}

.palette-item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.palette-label {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.palette-desc {
  font-size: 11px;
  color: #909399;
  line-height: 1.4;
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
.node-badge.navigate { background: #10b981; }
.node-badge.action { background: #409eff; }
.node-badge.wait { background: #64748b; }
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
