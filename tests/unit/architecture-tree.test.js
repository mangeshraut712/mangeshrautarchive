/**
 * @file Unit tests for ArchitectureTree & System Topology Flow
 * @module tests/unit/architecture-tree.test.js
 */

import { describe, expect, it } from 'vitest';
import { ArchitectureTree } from '../../src/js/modules/architecture-tree.js';

describe('ArchitectureTree', () => {
  it('instantiates with exactly 5 verified architectural nodes', () => {
    const tree = new ArchitectureTree(null);
    expect(tree.nodes).toHaveLength(5);
    const ids = tree.nodes.map(n => n.id);
    expect(ids).toEqual(['client', 'edge', 'backend', 'models', 'tools']);
  });

  it('contains grounded, verified metrics for Client Runtime', () => {
    const tree = new ArchitectureTree(null);
    const client = tree.nodes.find(n => n.id === 'client');
    expect(client).toBeDefined();
    expect(client.badge).toBe('Vanilla ESM');
    expect(client.metrics.runtime).toContain('0 KB Framework');
    expect(client.metrics.lighthouse).toBe('100/100 CI');
    expect(client.metrics.frameBudget).toContain('16ms');
  });

  it('contains grounded, verified metrics for Edge Gateway', () => {
    const tree = new ArchitectureTree(null);
    const edge = tree.nodes.find(n => n.id === 'edge');
    expect(edge).toBeDefined();
    expect(edge.badge).toContain('Pages');
    expect(edge.metrics.cdn).toContain('GitHub Pages');
    expect(edge.metrics.edgeWorker).toContain('Cloudflare Edge');
  });

  it('contains grounded, verified test counts for FastAPI backend', () => {
    const tree = new ArchitectureTree(null);
    const backend = tree.nodes.find(n => n.id === 'backend');
    expect(backend).toBeDefined();
    expect(backend.badge).toBe('Python 3.12+');
    expect(backend.metrics.tests).toContain('281 Unit');
    expect(backend.metrics.tests).toContain('176 API');
    expect(backend.metrics.pydantic).toBe('v2 Strict');
  });

  it('contains grounded, verified multi-model proxy routing info', () => {
    const tree = new ArchitectureTree(null);
    const models = tree.nodes.find(n => n.id === 'models');
    expect(models).toBeDefined();
    expect(models.badge).toContain('OpenRouter');
    expect(models.metrics.primary).toBe('x-ai/grok-4.3');
    expect(models.metrics.streamFormat).toBe('SSE NDJSON');
  });

  it('contains grounded, verified 17 active WebMCP tools', () => {
    const tree = new ArchitectureTree(null);
    const tools = tree.nodes.find(n => n.id === 'tools');
    expect(tools).toBeDefined();
    expect(tools.badge).toBe('17 Agentic Tools');
    expect(tools.metrics.tools).toBe('17 Active Tools');
    expect(tools.metrics.protocol).toBe('WebMCP v1');
  });

  it('renders SVG nodes with non-empty markup', () => {
    const container = document.createElement('div');
    new ArchitectureTree(container);
    expect(container.innerHTML).toContain('arch-tree-wrapper');
    expect(container.innerHTML).toContain('Agentic Full-Stack Pipeline');
    expect(container.innerHTML).toContain('arch-node-group');
    expect(container.querySelectorAll('.arch-node-group')).toHaveLength(5);
  });

  it('renders drawer details correctly when activated', () => {
    const container = document.createElement('div');
    const tree = new ArchitectureTree(container);
    const drawer = container.querySelector('#arch-details-drawer');
    const toolsNode = tree.nodes.find(n => n.id === 'tools');
    tree.renderDrawer(drawer, toolsNode);
    expect(drawer.innerHTML).toContain('17 Agentic Tools');
    expect(drawer.innerHTML).toContain('17 Active Tools');
    expect(drawer.innerHTML).toContain('WebMCP v1');
  });
});
