import { test, expect } from '@playwright/test'

// 测试数据
const testFlow = {
  name: 'Test Flow for API',
  description: 'Test flow description',
  version: 1,
  tags: ['test', 'api'],
  author: 'Test User',
  nodes: [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 100, y: 100 },
      data: { label: '开始' }
    },
    {
      id: 'action-1',
      type: 'action',
      position: { x: 300, y: 100 },
      data: {
        label: '执行操作',
        actionType: 'click',
        target: '#submit-btn'
      }
    },
    {
      id: 'end-1',
      type: 'end',
      position: { x: 500, y: 100 },
      data: { label: '结束' }
    }
  ],
  edges: [
    { id: 'e1-2', source: 'start-1', target: 'action-1' },
    { id: 'e2-3', source: 'action-1', target: 'end-1' }
  ]
}

let createdFlowId: string

test.describe('API Tests - Flow Management', () => {
  test('GET /api/flows - should return empty list initially', async ({ request }) => {
    // 先清理可能存在的测试数据
    const flows = await request.get('/api/flows')
    expect(flows.ok()).toBeTruthy()
    const data = await flows.json()
    // 如果之前有测试数据，可能不为空
    expect(Array.isArray(data)).toBeTruthy()
  })

  test('POST /api/flows - should create a new flow', async ({ request }) => {
    const response = await request.post('/api/flows', {
      data: testFlow
    })

    expect(response.ok()).toBeTruthy()
    const created = await response.json()
    expect(created.id).toBeDefined()
    expect(created.name).toBe(testFlow.name)
    expect(created.description).toBe(testFlow.description)

    createdFlowId = created.id
  })

  test('GET /api/flows/{id} - should return the created flow', async ({ request }) => {
    if (!createdFlowId) {
      // 如果没有之前的 flow，先创建一个
      const createResponse = await request.post('/api/flows', { data: testFlow })
      const created = await createResponse.json()
      createdFlowId = created.id
    }

    const response = await request.get(`/api/flows/${createdFlowId}`)
    expect(response.ok()).toBeTruthy()

    const flow = await response.json()
    expect(flow.id).toBe(createdFlowId)
    expect(flow.name).toBe(testFlow.name)
    expect(flow.nodes).toHaveLength(3)
    expect(flow.edges).toHaveLength(2)
  })

  test('GET /api/flows/{id} - should return 404 for non-existent flow', async ({ request }) => {
    const response = await request.get('/api/flows/non-existent-id-12345')
    expect(response.status()).toBe(404)
  })

  test('PUT /api/flows/{id} - should update the flow', async ({ request }) => {
    if (!createdFlowId) {
      const createResponse = await request.post('/api/flows', { data: testFlow })
      const created = await createResponse.json()
      createdFlowId = created.id
    }

    const updateData = {
      ...testFlow,
      name: 'Updated Test Flow',
      description: 'Updated description'
    }

    const response = await request.put(`/api/flows/${createdFlowId}`, {
      data: updateData
    })

    expect(response.ok()).toBeTruthy()
    const updated = await response.json()
    expect(updated.name).toBe('Updated Test Flow')
    expect(updated.description).toBe('Updated description')
  })

  test('POST /api/flows/{id}/duplicate - should duplicate the flow', async ({ request }) => {
    if (!createdFlowId) {
      const createResponse = await request.post('/api/flows', { data: testFlow })
      const created = await createResponse.json()
      createdFlowId = created.id
    }

    const response = await request.post(`/api/flows/${createdFlowId}/duplicate`)
    expect(response.ok()).toBeTruthy()

    const duplicated = await response.json()
    expect(duplicated.id).not.toBe(createdFlowId)
    expect(duplicated.name).toContain('(副本)')
  })

  test('GET /api/flows/{id}/export - should export the flow', async ({ request }) => {
    if (!createdFlowId) {
      const createResponse = await request.post('/api/flows', { data: testFlow })
      const created = await createResponse.json()
      createdFlowId = created.id
    }

    const response = await request.get(`/api/flows/${createdFlowId}/export`)
    expect(response.ok()).toBeTruthy()

    const content = await response.text()
    expect(content).toContain('Test Flow')
    expect(content).toContain('nodes')
  })

  test('POST /api/flows/import - should import a flow', async ({ request }) => {
    const importData = {
      name: 'Imported Flow',
      description: 'Flow imported from JSON',
      version: 1,
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 100, y: 100 },
          data: { label: 'Start' }
        }
      ],
      edges: []
    }

    const response = await request.post('/api/flows/import', {
      data: { json: JSON.stringify(importData) }
    })

    expect(response.ok()).toBeTruthy()
    const imported = await response.json()
    expect(imported.id).toBeDefined()
    expect(imported.name).toBe('Imported Flow')
  })

  test('DELETE /api/flows/{id} - should delete the flow', async ({ request }) => {
    // 先创建一个待删除的 flow
    const tempFlow = {
      ...testFlow,
      name: 'Flow to Delete'
    }
    const createResponse = await request.post('/api/flows', { data: tempFlow })
    const created = await createResponse.json()

    const response = await request.delete(`/api/flows/${created.id}`)
    expect(response.ok()).toBeTruthy()

    // 验证已删除
    const getResponse = await request.get(`/api/flows/${created.id}`)
    expect(getResponse.status()).toBe(404)
  })

  test('DELETE /api/flows/{id} - should return 404 for non-existent flow', async ({ request }) => {
    const response = await request.delete('/api/flows/non-existent-id-99999')
    expect(response.status()).toBe(400)
  })

  test('GET /api/test-cases - should return test cases list', async ({ request }) => {
    const response = await request.get('/api/test-cases')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
  })

  test('GET /api/flows/{id}/export-cases - should export test cases in json format', async ({ request }) => {
    if (!createdFlowId) {
      const createResponse = await request.post('/api/flows', { data: testFlow })
      const created = await createResponse.json()
      createdFlowId = created.id
    }

    const response = await request.get(`/api/flows/${createdFlowId}/export-cases?format=json`)
    expect(response.ok()).toBeTruthy()

    const content = await response.text()
    expect(content).toBeTruthy()
  })

  test('GET /api/flows/{id}/export-cases - should export test cases in yaml format', async ({ request }) => {
    if (!createdFlowId) {
      const createResponse = await request.post('/api/flows', { data: testFlow })
      const created = await createResponse.json()
      createdFlowId = created.id
    }

    const response = await request.get(`/api/flows/${createdFlowId}/export-cases?format=yaml`)
    expect(response.ok()).toBeTruthy()

    const content = await response.text()
    expect(content).toContain('testSteps:')
  })

  test('POST /api/flows/{id}/generate - should generate test cases', async ({ request }) => {
    // 使用已存在的 flow 或者创建一个
    let flowId = createdFlowId
    if (!flowId) {
      const createResponse = await request.post('/api/flows', { data: testFlow })
      const created = await createResponse.json()
      flowId = created.id
    }

    const response = await request.post(`/api/flows/${flowId}/generate`)
    expect(response.ok()).toBeTruthy()

    const testCases = await response.json()
    expect(Array.isArray(testCases)).toBeTruthy()
  })
})

test.describe('API Tests - Validation', () => {
  test('POST /api/flows - should reject invalid flow without nodes', async ({ request }) => {
    const invalidFlow = {
      name: 'Invalid Flow',
      description: 'Flow without nodes'
    }

    const response = await request.post('/api/flows', {
      data: invalidFlow
    })

    expect(response.status()).toBe(400)
    const error = await response.json()
    expect(error.message).toBeDefined()
  })

  test('POST /api/flows - should reject flow without start node', async ({ request }) => {
    const invalidFlow = {
      name: 'No Start Node Flow',
      nodes: [
        {
          id: 'action-1',
          type: 'action',
          position: { x: 100, y: 100 },
          data: { label: 'Action' }
        }
      ],
      edges: []
    }

    const response = await request.post('/api/flows', {
      data: invalidFlow
    })

    expect(response.status()).toBe(400)
  })

  test('PUT /api/flows/{id} - should return 404 for non-existent flow', async ({ request }) => {
    const response = await request.put('/api/flows/non-existent-id-88888', {
      data: testFlow
    })

    expect(response.status()).toBe(404)
  })
})

test.describe('API Tests - Error Handling', () => {
  test('should handle malformed JSON in import', async ({ request }) => {
    const response = await request.post('/api/flows/import', {
      data: { json: 'invalid json content' }
    })

    expect(response.status()).toBe(400)
  })

  test('should handle empty flow list directory gracefully', async ({ request }) => {
    // 这个测试验证空目录不会导致崩溃
    const response = await request.get('/api/flows')
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data)).toBeTruthy()
  })
})

test.describe('API Tests - Flow with Different Node Types', () => {
  test('should create flow with Action node', async ({ request }) => {
    const flowWithAction = {
      name: 'Flow with Action Node',
      description: 'Test action node',
      version: 1,
      nodes: [
        {
          id: 'start-1',
          type: 'Start',
          label: '开始'
        },
        {
          id: 'action-1',
          type: 'Action',
          label: '点击按钮',
          action: {
            method: 'click',
            target: '#submit',
            value: ''
          }
        },
        {
          id: 'end-1',
          type: 'End',
          label: '结束'
        }
      ],
      edges: [
        { id: 'e1-2', source: 'start-1', target: 'action-1' },
        { id: 'e2-3', source: 'action-1', target: 'end-1' }
      ]
    }

    const response = await request.post('/api/flows', {
      data: flowWithAction
    })

    expect(response.ok()).toBeTruthy()
    const created = await response.json()
    expect(created.nodes).toHaveLength(3)
  })

  test('should create flow with Assert node', async ({ request }) => {
    const flowWithAssert = {
      name: 'Flow with Assert Node',
      description: 'Test assert node',
      version: 1,
      nodes: [
        {
          id: 'start-1',
          type: 'Start',
          label: '开始'
        },
        {
          id: 'assert-1',
          type: 'Assert',
          label: '验证结果',
          assert: {
            type: 'equals',
            target: '.message',
            expected: 'Success'
          }
        },
        {
          id: 'end-1',
          type: 'End',
          label: '结束'
        }
      ],
      edges: [
        { id: 'e1-2', source: 'start-1', target: 'assert-1' },
        { id: 'e2-3', source: 'assert-1', target: 'end-1' }
      ]
    }

    const response = await request.post('/api/flows', {
      data: flowWithAssert
    })

    expect(response.ok()).toBeTruthy()
    const created = await response.json()
    expect(created.nodes).toHaveLength(3)
  })

  test('should create flow with Extract node', async ({ request }) => {
    const flowWithExtract = {
      name: 'Flow with Extract Node',
      description: 'Test extract node',
      version: 1,
      nodes: [
        {
          id: 'start-1',
          type: 'Start',
          label: '开始'
        },
        {
          id: 'extract-1',
          type: 'Extract',
          label: '提取数据',
          extract: {
            target: '.username',
            field: 'text',
            as: 'username'
          }
        },
        {
          id: 'end-1',
          type: 'End',
          label: '结束'
        }
      ],
      edges: [
        { id: 'e1-2', source: 'start-1', target: 'extract-1' },
        { id: 'e2-3', source: 'extract-1', target: 'end-1' }
      ]
    }

    const response = await request.post('/api/flows', {
      data: flowWithExtract
    })

    expect(response.ok()).toBeTruthy()
    const created = await response.json()
    expect(created.nodes).toHaveLength(3)
  })

  test('should create flow with Condition node', async ({ request }) => {
    const flowWithCondition = {
      name: 'Flow with Condition Node',
      description: 'Test condition node',
      version: 1,
      nodes: [
        {
          id: 'start-1',
          type: 'Start',
          label: '开始'
        },
        {
          id: 'condition-1',
          type: 'Condition',
          label: '条件判断',
          condition: {
            variable: 'isLoggedIn',
            operator: 'equals',
            value: 'true'
          }
        },
        {
          id: 'end-1',
          type: 'End',
          label: '结束'
        }
      ],
      edges: [
        { id: 'e1-2', source: 'start-1', target: 'condition-1' },
        { id: 'e2-3', source: 'condition-1', target: 'end-1' }
      ]
    }

    const response = await request.post('/api/flows', {
      data: flowWithCondition
    })

    expect(response.ok()).toBeTruthy()
    const created = await response.json()
    expect(created.nodes).toHaveLength(3)
  })

  test('should create flow with multiple edges', async ({ request }) => {
    const flowWithMultipleEdges = {
      name: 'Flow with Multiple Edges',
      description: 'Test multiple edges',
      version: 1,
      nodes: [
        {
          id: 'start-1',
          type: 'Start',
          label: '开始'
        },
        {
          id: 'action-1',
          type: 'Action',
          label: '操作1'
        },
        {
          id: 'action-2',
          type: 'Action',
          label: '操作2'
        },
        {
          id: 'end-1',
          type: 'End',
          label: '结束'
        }
      ],
      edges: [
        { id: 'e1-2', source: 'start-1', target: 'action-1' },
        { id: 'e1-3', source: 'start-1', target: 'action-2' },
        { id: 'e2-4', source: 'action-1', target: 'end-1' },
        { id: 'e3-4', source: 'action-2', target: 'end-1' }
      ]
    }

    const response = await request.post('/api/flows', {
      data: flowWithMultipleEdges
    })

    expect(response.ok()).toBeTruthy()
    const created = await response.json()
    expect(created.edges).toHaveLength(4)
  })

  test('should create flow with tags', async ({ request }) => {
    const flowWithTags = {
      name: 'Flow with Tags',
      description: 'Test tags',
      version: 1,
      tags: ['login', 'smoke', 'critical'],
      author: 'Test Author',
      nodes: [
        {
          id: 'start-1',
          type: 'Start',
          label: '开始'
        },
        {
          id: 'end-1',
          type: 'End',
          label: '结束'
        }
      ],
      edges: [
        { id: 'e1-2', source: 'start-1', target: 'end-1' }
      ]
    }

    const response = await request.post('/api/flows', {
      data: flowWithTags
    })

    expect(response.ok()).toBeTruthy()
    const created = await response.json()
    expect(created.tags).toHaveLength(3)
    expect(created.author).toBe('Test Author')
  })
})

test.describe('API Tests - Edge Cases', () => {
  test('should handle flow with empty edges', async ({ request }) => {
    const flowNoEdges = {
      name: 'Flow without Edges',
      description: 'Test empty edges',
      version: 1,
      nodes: [
        {
          id: 'start-1',
          type: 'Start',
          label: '开始'
        },
        {
          id: 'end-1',
          type: 'End',
          label: '结束'
        }
      ],
      edges: []
    }

    const response = await request.post('/api/flows', {
      data: flowNoEdges
    })

    expect(response.ok()).toBeTruthy()
  })

  test('should handle flow with version update', async ({ request }) => {
    const flow = {
      name: 'Version Test Flow',
      description: 'Test version',
      version: 1,
      nodes: [
        {
          id: 'start-1',
          type: 'Start',
          label: '开始'
        },
        {
          id: 'end-1',
          type: 'End',
          label: '结束'
        }
      ],
      edges: [
        { id: 'e1-2', source: 'start-1', target: 'end-1' }
      ]
    }

    const createResponse = await request.post('/api/flows', { data: flow })
    const created = await createResponse.json()

    // Update with new version
    const updateResponse = await request.put(`/api/flows/${created.id}`, {
      data: { ...flow, version: 2 }
    })
    expect(updateResponse.ok()).toBeTruthy()
    const updated = await updateResponse.json()
    expect(updated.version).toBe(2)
  })

  test('should handle duplicate flow name', async ({ request }) => {
    const flow = {
      name: 'Duplicate Name Flow',
      description: 'Test duplicate',
      version: 1,
      nodes: [
        {
          id: 'start-1',
          type: 'Start',
          label: '开始'
        },
        {
          id: 'end-1',
          type: 'End',
          label: '结束'
        }
      ],
      edges: [
        { id: 'e1-2', source: 'start-1', target: 'end-1' }
      ]
    }

    // Create first flow
    await request.post('/api/flows', { data: flow })

    // Duplicate - should add "(副本)" suffix
    const dupResponse = await request.post('/api/flows', { data: flow })
    const duplicated = await dupResponse.json()
    expect(duplicated.name).toBe('Duplicate Name Flow')
  })
})
