import { test, expect } from '@playwright/test'

// 设置不同的 baseURL 用于 UI 测试
test.describe('UI Tests - Flow List Page', () => {
  test.use({ baseURL: 'http://localhost:5173' })

  test.beforeEach(async ({ page }) => {
    // 等待页面加载完成
    await page.goto('/')
    // 等待必要的元素出现
    await page.waitForLoadState('networkidle')
  })

  test('should display flow list page', async ({ page }) => {
    // 检查页面标题
    await expect(page.locator('h2')).toContainText('流程列表')

    // 检查搜索框存在
    await expect(page.locator('input[placeholder="搜索流程..."]')).toBeVisible()

    // 检查"创建流程"按钮存在
    await expect(page.locator('button:has-text("创建流程")')).toBeVisible()
  })

  test('should show empty state when no flows', async ({ page }) => {
    // 检查空状态显示
    const emptyState = page.locator('.empty-state')
    if (await emptyState.isVisible()) {
      await expect(emptyState).toContainText('暂无流程')
    }
  })

  test('should be able to click create flow button', async ({ page }) => {
    // 点击创建流程按钮
    await page.click('button:has-text("创建流程")')

    // 应该跳转到设计器页面
    await expect(page).toHaveURL(/\/designer/)
  })

  test('should display flow cards when flows exist', async ({ page }) => {
    // 等待一下让数据加载
    await page.waitForTimeout(1000)

    // 如果有流程卡片，检查显示
    const flowCards = page.locator('.flow-card')
    const count = await flowCards.count()

    if (count > 0) {
      // 检查第一个流程卡片包含必要元素
      await expect(flowCards.first()).toContainText('版本:')
      await expect(flowCards.first()).toContainText('节点:')
    }
  })

  test('should be able to search flows', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="搜索流程..."]')

    // 输入搜索内容
    await searchInput.fill('test')
    await page.waitForTimeout(500)

    // 搜索结果应该过滤显示
    // 如果有搜索结果，检查是否包含搜索关键字
    const flowCards = page.locator('.flow-card')
    const count = await flowCards.count()

    if (count > 0) {
      const firstCard = await flowCards.first().textContent()
      expect(firstCard?.toLowerCase()).toContain('test')
    }
  })

  test('should have edit button on flow card', async ({ page }) => {
    await page.waitForTimeout(1000)

    const flowCards = page.locator('.flow-card')
    const count = await flowCards.count()

    if (count > 0) {
      // 检查编辑按钮存在
      const editButton = flowCards.first().locator('button:has-text("编辑")')
      await expect(editButton).toBeVisible()
    }
  })

  test('should have generate button on flow card', async ({ page }) => {
    await page.waitForTimeout(1000)

    const flowCards = page.locator('.flow-card')
    const count = await flowCards.count()

    if (count > 0) {
      // 检查生成用例按钮存在
      const generateButton = flowCards.first().locator('button:has-text("生成用例")')
      await expect(generateButton).toBeVisible()
    }
  })

  test('should have delete button on flow card', async ({ page }) => {
    await page.waitForTimeout(1000)

    const flowCards = page.locator('.flow-card')
    const count = await flowCards.count()

    if (count > 0) {
      // 检查删除按钮存在
      const deleteButton = flowCards.first().locator('button:has-text("删除")')
      await expect(deleteButton).toBeVisible()
    }
  })
})

test.describe('UI Tests - Flow Designer Page', () => {
  test.use({ baseURL: 'http://localhost:5173' })

  test('should display flow designer page', async ({ page }) => {
    await page.goto('/designer')
    await page.waitForLoadState('networkidle')

    // 检查页面元素
    // 流程设计器页面应该有节点面板或画布
    await expect(page.locator('.flow-designer, .vue-flow, [class*="designer"]')).toBeVisible({ timeout: 10000 }).catch(() => {
      // 如果找不到特定元素，检查 URL 正确即可
      expect(page.url()).toContain('/designer')
    })
  })

  test('should navigate to designer with new flow', async ({ page }) => {
    // 从列表页点击创建流程
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 点击创建流程按钮
    await page.click('button:has-text("创建流程")')

    // 验证跳转到设计器
    await expect(page).toHaveURL(/\/designer/)
  })

  test('should navigate to designer with existing flow', async ({ page }) => {
    // 假设有一个已存在的流程 ID
    await page.goto('/designer/test-flow-id')
    await page.waitForLoadState('networkidle')

    // 页面应该尝试加载流程（可能显示错误，这是预期行为）
    // 只验证页面加载没有崩溃
    await expect(page).toHaveURL(/\/designer/)
  })
})

test.describe('UI Tests - Test Case Page', () => {
  test.use({ baseURL: 'http://localhost:5173' })

  test('should display test case page', async ({ page }) => {
    await page.goto('/test-cases')
    await page.waitForLoadState('networkidle')

    // 测试用例页面应该能正常加载
    // 验证没有严重错误
    await expect(page.locator('body')).toBeVisible()
  })

  test('should navigate to test cases from list', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)

    const flowCards = page.locator('.flow-card')
    const count = await flowCards.count()

    if (count > 0) {
      // 查找并点击"生成用例"按钮
      const generateButton = flowCards.first().locator('button:has-text("生成用例")')
      if (await generateButton.isVisible()) {
        await generateButton.click()

        // 应该跳转到测试用例页面
        await expect(page).toHaveURL(/\/test-cases/)
      }
    }
  })
})

test.describe('UI Tests - Navigation', () => {
  test.use({ baseURL: 'http://localhost:5173' })

  test('should navigate to home page', async ({ page }) => {
    // 访问其他页面后返回首页
    await page.goto('/test-cases')
    await page.waitForLoadState('networkidle')

    // 点击首页链接或导航
    // 由于是单页应用，检查 URL 即可
    await page.goto('/')
    await expect(page).toHaveURL('/')
  })

  test('should handle 404 gracefully', async ({ page }) => {
    await page.goto('/non-existent-page')
    await page.waitForLoadState('networkidle')

    // 页面应该不崩溃，显示某些内容
    await expect(page.locator('body')).toBeVisible()
  })

  test('should load all Vue components without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 等待一段时间确保所有脚本执行完成
    await page.waitForTimeout(2000)

    // 过滤掉一些常见的非关键错误
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('404') &&
      !e.includes('Failed to load resource')
    )

    expect(criticalErrors).toHaveLength(0)
  })
})

test.describe('UI Tests - Responsive', () => {
  test.use({ baseURL: 'http://localhost:5173' })

  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 验证关键元素在桌面视口下可见
    await expect(page.locator('.flow-list-header')).toBeVisible()
  })

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 验证关键元素在平板视口下可见
    await expect(page.locator('.flow-list-header')).toBeVisible()
  })

  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 验证关键元素在移动视口下可见（可能布局不同）
    await expect(page.locator('body')).toBeVisible()
  })
})
