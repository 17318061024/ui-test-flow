import StartNode from './StartNode.vue'
import EndNode from './EndNode.vue'
import NavigateNode from './NavigateNode.vue'
import ActionNode from './ActionNode.vue'
import WaitNode from './WaitNode.vue'
import AssertNode from './AssertNode.vue'
import ExtractNode from './ExtractNode.vue'
import ConditionNode from './ConditionNode.vue'
import SubFlowNode from './SubFlowNode.vue'
import AIActionNode from './AIActionNode.vue'
import AIQueryNode from './AIQueryNode.vue'
import AIAssertNode from './AIAssertNode.vue'

export const nodeTypes = {
  Start: StartNode,
  End: EndNode,
  Navigate: NavigateNode,
  Action: ActionNode,
  Wait: WaitNode,
  Assert: AssertNode,
  Extract: ExtractNode,
  Condition: ConditionNode,
  SubFlow: SubFlowNode,
  AIAction: AIActionNode,
  AIQuery: AIQueryNode,
  AIAssert: AIAssertNode
}

export {
  StartNode,
  EndNode,
  NavigateNode,
  ActionNode,
  WaitNode,
  AssertNode,
  ExtractNode,
  ConditionNode,
  SubFlowNode,
  AIActionNode,
  AIQueryNode,
  AIAssertNode
}
