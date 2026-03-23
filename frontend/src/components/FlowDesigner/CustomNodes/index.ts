import StartNode from './StartNode.vue'
import EndNode from './EndNode.vue'
import ActionNode from './ActionNode.vue'
import AssertNode from './AssertNode.vue'
import ExtractNode from './ExtractNode.vue'
import ConditionNode from './ConditionNode.vue'
import SubFlowNode from './SubFlowNode.vue'

export const nodeTypes = {
  Start: StartNode,
  End: EndNode,
  Action: ActionNode,
  Assert: AssertNode,
  Extract: ExtractNode,
  Condition: ConditionNode,
  SubFlow: SubFlowNode
}

export {
  StartNode,
  EndNode,
  ActionNode,
  AssertNode,
  ExtractNode,
  ConditionNode,
  SubFlowNode
}
