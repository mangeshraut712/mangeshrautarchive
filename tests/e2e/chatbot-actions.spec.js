import { expect, test } from '@playwright/test';

test.describe('Chatbot Agentic Actions & WebMCP Tool Registration', () => {
  // Test 1: Mock WebMCP and verify client-side tools are registered
  test('should register WebMCP tools when navigator.modelContext is present', async ({ page }) => {
    // Define the modelContext mock before navigation
    await page.addInitScript(() => {
      const tools = [];
      Object.defineProperty(navigator, 'modelContext', {
        value: {
          registerTool: (tool, options) => {
            tools.push({ tool, options });
          },
        },
        configurable: true,
        writable: true,
      });
      // Keep track of registered tools globally so we can access them from the test
      window.__registeredTools = tools;
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Simulate an interaction event to trigger lazy loading of modules
    await page.keyboard.press('Escape');
    // Open the chatbot toggle which also loads chatbot modules
    const toggleBtn = page.locator('#chatbot-toggle');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    // Wait for chatbot components to load/initialize
    await page.waitForTimeout(1500);

    // Retrieve the registered tools from the page context
    const tools = await page.evaluate(() => window.__registeredTools || []);

    console.log(
      'Registered WebMCP tools:',
      tools.map(t => t.tool.name)
    );

    // Assert that we registered all 9 tools
    expect(tools.length).toBe(9);

    // Check specific tools
    const toolNames = tools.map(t => t.tool.name);
    expect(toolNames).toContain('navigate_to_section');
    expect(toolNames).toContain('download_resume');
    expect(toolNames).toContain('schedule_meeting');
    expect(toolNames).toContain('open_contact_form');
    expect(toolNames).toContain('copy_contact_info');
    expect(toolNames).toContain('search_portfolio');
    expect(toolNames).toContain('filter_projects');
    expect(toolNames).toContain('open_social_media');
    expect(toolNames).toContain('toggle_theme');
  });

  // Test 2: Local agentic action regex interception and visual feedback
  test('should intercept toggle theme action and render custom styling and badge', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Open chatbot
    const toggleBtn = page.locator('#chatbot-toggle');
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    const widget = page.locator('#chatbot-widget');
    await expect(widget).toBeVisible();

    // Check current theme
    const isInitialDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    console.log('Initial theme dark:', isInitialDark);

    // Ask to toggle theme
    const textarea = page.locator('#chatbot-input');
    await textarea.fill('toggle to dark mode');

    const sendBtn = page.locator('.chatbot-send-btn');
    await sendBtn.click();

    // Wait for the action to complete
    await page.waitForTimeout(2000);

    // Assert theme was toggled
    const isNewDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    );
    console.log('New theme dark:', isNewDark);
    expect(isNewDark).toBe(!isInitialDark);

    // Debug element visibility and computed styles
    const debugInfo = await page.evaluate(() => {
      const el = document.querySelector('.message.action-message');
      if (!el) return { found: false };

      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      // Also trace parent styles
      const parents = [];
      let parent = el.parentElement;
      while (parent) {
        const pStyle = window.getComputedStyle(parent);
        parents.push({
          tag: parent.tagName,
          id: parent.id,
          className: parent.className,
          display: pStyle.display,
          visibility: pStyle.visibility,
          opacity: pStyle.opacity,
          rect: parent.getBoundingClientRect(),
        });
        parent = parent.parentElement;
      }

      return {
        found: true,
        rect,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        className: el.className,
        parents,
      };
    });

    console.log('Action Message Debug Info:', JSON.stringify(debugInfo, null, 2));

    // Assert custom visual action elements are present
    const actionMessage = page.locator('.message.action-message');
    await expect(actionMessage).toBeVisible();

    const actionBadge = page.locator('.action-badge');
    await expect(actionBadge).toBeVisible();
    await expect(actionBadge.locator('.action-badge-text')).toHaveText('ACTION EXECUTED');
  });
});
