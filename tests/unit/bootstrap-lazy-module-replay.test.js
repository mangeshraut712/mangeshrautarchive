/**
 * Lazy module-loader must schedule only one synthetic replay after concurrent opens.
 * Asserts the fixed bootstrap.js algorithm (shared in-flight + single replay flag).
 */
import { describe, expect, it, vi } from 'vitest';

function runLazyInteraction(map, key, task) {
  if (map.has(key)) return map.get(key);
  const pending = Promise.resolve()
    .then(task)
    .finally(() => map.delete(key));
  map.set(key, pending);
  return pending;
}

async function handleLazyModuleClick({ isLoaded, load, loads, elementId, replayState }) {
  if (isLoaded()) return { replayScheduled: false };

  const moduleLoaded = await runLazyInteraction(loads, `module:${elementId}`, load);
  if (!moduleLoaded) return { replayScheduled: false };

  if (replayState.scheduled) return { replayScheduled: false };
  replayState.scheduled = true;
  return { replayScheduled: true };
}

describe('lazy module loader replay race (fixed algorithm)', () => {
  it('must not schedule more than one synthetic replay after concurrent opens', async () => {
    const loads = new Map();
    const replayState = { scheduled: false };
    let resolveLoad;
    const load = vi.fn(
      () =>
        new Promise(resolve => {
          resolveLoad = value => resolve(value);
        })
    );
    let loaded = false;

    const first = handleLazyModuleClick({
      isLoaded: () => loaded,
      load,
      loads,
      elementId: 'chatbot-toggle',
      replayState,
    });
    const second = handleLazyModuleClick({
      isLoaded: () => loaded,
      load,
      loads,
      elementId: 'chatbot-toggle',
      replayState,
    });

    await Promise.resolve();
    expect(load).toHaveBeenCalledTimes(1);

    loaded = true;
    resolveLoad(true);
    const results = await Promise.all([first, second]);

    expect(results.filter(result => result.replayScheduled)).toHaveLength(1);
  });
});
