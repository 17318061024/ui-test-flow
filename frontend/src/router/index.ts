import { createRouter, createWebHistory } from 'vue-router'
import FlowListView from '@/views/FlowListView.vue'
import FlowDesignerView from '@/views/FlowDesignerView.vue'
import TestCaseView from '@/views/TestCaseView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'flow-list',
      component: FlowListView
    },
    {
      path: '/designer',
      name: 'flow-designer',
      component: FlowDesignerView
    },
    {
      path: '/designer/:id',
      name: 'flow-designer-edit',
      component: FlowDesignerView
    },
    {
      path: '/test-cases',
      name: 'test-cases',
      component: TestCaseView
    }
  ]
})

export default router
