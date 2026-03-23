import type { TestFlow, FlowMeta, TestCase } from '@/types/flow'

const API_BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }))
    console.error('API Error:', response.status, error)
    console.error('Validation errors:', error.errors)
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// 流程列表
export async function getFlowList(): Promise<FlowMeta[]> {
  return request<FlowMeta[]>('/flows')
}

// 获取单个流程
export async function getFlow(id: string): Promise<TestFlow> {
  return request<TestFlow>(`/flows/${id}`)
}

// 创建流程
export async function createFlow(flow: Omit<TestFlow, 'id' | 'createdAt' | 'updatedAt'>): Promise<TestFlow> {
  return request<TestFlow>('/flows', {
    method: 'POST',
    body: JSON.stringify(flow)
  })
}

// 更新流程
export async function updateFlow(id: string, flow: Partial<TestFlow>): Promise<TestFlow> {
  return request<TestFlow>(`/flows/${id}`, {
    method: 'PUT',
    body: JSON.stringify(flow)
  })
}

// 删除流程
export async function deleteFlow(id: string): Promise<void> {
  await request(`/flows/${id}`, {
    method: 'DELETE'
  })
}

// 复制流程
export async function duplicateFlow(id: string): Promise<TestFlow> {
  return request<TestFlow>(`/flows/${id}/duplicate`, {
    method: 'POST'
  })
}

// 导出流程
export async function exportFlow(id: string): Promise<string> {
  return request<string>(`/flows/${id}/export`)
}

// 导入流程
export async function importFlow(json: string): Promise<TestFlow> {
  return request<TestFlow>('/flows/import', {
    method: 'POST',
    body: JSON.stringify({ json })
  })
}

// 生成测试用例
export async function generateTestCases(flowId: string): Promise<TestCase[]> {
  return request<TestCase[]>(`/flows/${flowId}/generate`, {
    method: 'POST'
  })
}

// 获取测试用例列表
export async function getTestCases(): Promise<TestCase[]> {
  return request<TestCase[]>('/test-cases')
}

// 获取单个测试用例
export async function getTestCase(id: string): Promise<TestCase> {
  return request<TestCase>(`/test-cases/${id}`)
}

// 导出测试用例
export async function exportTestCases(flowId: string, format: 'json' | 'yaml' | 'script'): Promise<string> {
  const response = await fetch(`${API_BASE}/flows/${flowId}/export-cases?format=${format}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }))
    console.error('API Error:', response.status, error)
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  // 导出脚本时返回文本，其他格式返回字符串
  return response.text()
}
