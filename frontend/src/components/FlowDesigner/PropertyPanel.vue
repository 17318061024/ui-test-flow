<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useFlowStore } from '@/stores/flow'
import type { ActionMethod, AssertType, ConditionOperator, FlowNode } from '@/types/flow'

const flowStore = useFlowStore()

const selectedNode = computed(() => flowStore.selectedNode)

// 本地编辑状态
const localNode = ref<Partial<FlowNode>>({})

// 监听选中节点变化，同步到本地状态
watch(selectedNode, (node) => {
  if (node) {
    // 为不同类型节点初始化配置对象
    const base = { ...node }
    if (node.type === 'Action' && !base.action) {
      base.action = { method: 'click', target: '' }
    }
    if (node.type === 'Assert' && !base.assert) {
      base.assert = { type: 'visible', target: '', expected: '' }
    }
    if (node.type === 'Extract' && !base.extract) {
      base.extract = { target: '', field: '', as: '' }
    }
    if (node.type === 'Condition' && !base.condition) {
      base.condition = { variable: '', operator: '==', value: '' }
    }
    if (node.type === 'SubFlow' && !base.subFlow) {
      base.subFlow = { flowId: '' }
    }
    localNode.value = base
  } else {
    localNode.value = {}
  }
}, { immediate: true, deep: true })

// 保存更改
function saveChanges() {
  if (selectedNode.value && localNode.value.id) {
    flowStore.updateNode(localNode.value.id, localNode.value)
  }
}

// 删除节点
function deleteNode() {
  if (selectedNode.value) {
    flowStore.deleteNode(selectedNode.value.id)
  }
}

// 操作方法选项
const actionMethods: { label: string; value: ActionMethod }[] = [
  { label: '点击 (click)', value: 'click' },
  { label: '输入 (input)', value: 'input' },
  { label: '选择 (select)', value: 'select' },
  { label: '悬停 (hover)', value: 'hover' },
  { label: '滚动 (scroll)', value: 'scroll' },
  { label: '等待 (wait)', value: 'wait' },
  { label: '截图 (screenshot)', value: 'screenshot' }
]

// 断言类型选项
const assertTypes: { label: string; value: AssertType }[] = [
  { label: '检查文本 (text)', value: 'text' },
  { label: '元素可见 (visible)', value: 'visible' },
  { label: '元素隐藏 (hidden)', value: 'hidden' },
  { label: '元素可用 (enabled)', value: 'enabled' },
  { label: '包含文本 (contains)', value: 'contains' }
]

// 条件操作符选项
const conditionOperators: { label: string; value: ConditionOperator }[] = [
  { label: '等于 (==)', value: '==' },
  { label: '不等于 (!=)', value: '!=' },
  { label: '包含 (contains)', value: 'contains' },
  { label: '为空 (empty)', value: 'empty' },
  { label: '不为空 (notEmpty)', value: 'notEmpty' }
]
</script>

<template>
  <div class="flow-designer-properties">
    <template v-if="selectedNode">
      <div class="property-panel-title">
        {{ selectedNode.type }} - 属性配置
      </div>

      <!-- 基础属性 -->
      <el-form label-width="80px" size="small">
        <el-form-item label="节点名称">
          <el-input v-model="localNode.label" @blur="saveChanges" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="localNode.description" type="textarea" rows="2" @blur="saveChanges" />
        </el-form-item>
      </el-form>

      <!-- Action 节点配置 -->
      <template v-if="selectedNode.type === 'Action' && localNode.action">
        <div class="property-section-title">操作配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="操作方法">
            <el-select v-model="localNode.action.method" @change="saveChanges">
              <el-option
                v-for="method in actionMethods"
                :key="method.value"
                :label="method.label"
                :value="method.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="目标元素">
            <el-input v-model="localNode.action.target" placeholder="描述目标元素" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="输入值" v-if="localNode.action?.method === 'input' || localNode.action?.method === 'select'">
            <el-input v-model="localNode.action.value" placeholder="输入的值" @blur="saveChanges" />
          </el-form-item>
        </el-form>
      </template>

      <!-- Assert 节点配置 -->
      <template v-if="selectedNode.type === 'Assert' && localNode.assert">
        <div class="property-section-title">断言配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="断言类型">
            <el-select v-model="localNode.assert.type" @change="saveChanges">
              <el-option
                v-for="t in assertTypes"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="目标元素">
            <el-input v-model="localNode.assert.target" placeholder="描述目标元素" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="期望值">
            <el-input v-model="localNode.assert.expected" placeholder="期望的值" @blur="saveChanges" />
          </el-form-item>
        </el-form>
      </template>

      <!-- Extract 节点配置 -->
      <template v-if="selectedNode.type === 'Extract' && localNode.extract">
        <div class="property-section-title">提取配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="目标元素">
            <el-input v-model="localNode.extract.target" placeholder="描述目标元素" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="提取字段">
            <el-input v-model="localNode.extract.field" placeholder="提取的字段名" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="变量名">
            <el-input v-model="localNode.extract.as" placeholder="保存为变量名" @blur="saveChanges" />
          </el-form-item>
        </el-form>
      </template>

      <!-- Condition 节点配置 -->
      <template v-if="selectedNode.type === 'Condition' && localNode.condition">
        <div class="property-section-title">条件配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="变量名">
            <el-input v-model="localNode.condition.variable" placeholder="判断的变量名" @blur="saveChanges" />
          </el-form-item>
          <el-form-item label="操作符">
            <el-select v-model="localNode.condition.operator" @change="saveChanges">
              <el-option
                v-for="op in conditionOperators"
                :key="op.value"
                :label="op.label"
                :value="op.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="比较值">
            <el-input v-model="localNode.condition.value" placeholder="比较的值" @blur="saveChanges" />
          </el-form-item>
        </el-form>
      </template>

      <!-- SubFlow 节点配置 -->
      <template v-if="selectedNode.type === 'SubFlow' && localNode.subFlow">
        <div class="property-section-title">子流程配置</div>
        <el-form label-width="80px" size="small">
          <el-form-item label="流程ID">
            <el-input v-model="localNode.subFlow.flowId" placeholder="引用的流程ID" @blur="saveChanges" />
          </el-form-item>
        </el-form>
      </template>

      <!-- 删除按钮 -->
      <div class="property-actions" v-if="selectedNode.type !== 'Start'">
        <el-button type="danger" size="small" @click="deleteNode">删除节点</el-button>
      </div>
    </template>

    <!-- 空状态 -->
    <template v-else>
      <div class="empty-state">
        <div class="empty-state-icon">👆</div>
        <div class="empty-state-text">点击节点查看属性</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.property-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin: 16px 0 12px;
  padding-top: 12px;
  border-top: 1px solid #e4e7ed;
}

.property-actions {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}

.empty-state-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state-text {
  font-size: 14px;
}
</style>
