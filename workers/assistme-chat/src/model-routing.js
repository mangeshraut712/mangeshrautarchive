/** Capability-aware routing. Catalog facts are refreshed hourly; no client model is trusted. */
import policy from '../../../api/chat_policy.json' with { type: 'json' };
let catalog = {
  models: policy.models.map(m => ({ ...m, free: true })),
  checkedAt: null,
};
let refreshAfter = 0;
let pendingRefresh;

export async function getModelCatalog() {
  if (Date.now() < refreshAfter) return catalog;
  if (pendingRefresh) return pendingRefresh;
  pendingRefresh = (async () => {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) throw new Error('Catalog unavailable');
      const data = await response.json();
      const models = (data.data || [])
        .filter(
          m =>
            m.architecture?.output_modalities?.includes('text') &&
            !/content-safety|moderation|embed|rerank/i.test(m.id)
        )
        .map(m => ({
          id: m.id,
          name: m.name,
          inputs: m.architecture.input_modalities,
          outputs: m.architecture.output_modalities,
          context: m.context_length,
          free:
            m.pricing?.prompt != null &&
            m.pricing?.completion != null &&
            Object.values(m.pricing).every(price => Number(price) === 0),
          pricing: { prompt: m.pricing?.prompt, completion: m.pricing?.completion },
          created: m.created,
        }));
      if (!models.length) throw new Error('Empty catalog');
      catalog = { models, checkedAt: new Date().toISOString() };
      refreshAfter = Date.now() + 3600_000;
    } catch {
      refreshAfter = Date.now() + 60_000;
    } finally {
      pendingRefresh = null;
    }
    return catalog;
  })();
  return pendingRefresh;
}

export async function selectModelRoute(env, message, modalities) {
  const current = await getModelCatalog();
  const compatible = current.models.filter(m => modalities.every(type => m.inputs.includes(type)));
  const free = compatible.filter(m => m.free && m.id.endsWith(':free'));
  const task = modalities.includes('audio')
    ? 'audio'
    : modalities.includes('video')
      ? 'video'
      : modalities.includes('image')
        ? 'image'
        : /\b(code|debug|javascript|python|sql|function|programming|java|cpp|c\+\+|golang|go|rust|typescript|html|css|script|algorithm|syntax)\b/i.test(
              message
            )
          ? 'code'
          : message.length < 100 &&
              !/\b(explain|compare|analy[sz]e|reason|why|research)\b/i.test(message)
            ? 'quick'
            : 'reasoning';
  const preferred = [...policy.preferred[task]];
  if (task === 'reasoning' && env.OPENROUTER_MODEL) preferred.unshift(env.OPENROUTER_MODEL);
  const available = new Set(free.map(m => m.id));
  const chain = [...preferred.filter(id => available.has(id)), ...free.map(m => m.id)];
  if (modalities.every(m => ['text', 'image'].includes(m))) chain.push('openrouter/free');
  return {
    chain: [...new Set(chain)].slice(0, 7),
    task,
    modalities,
    checkedAt: current.checkedAt,
  };
}

export function requestPlugins(model, messages) {
  const parts = messages.flatMap(m => (Array.isArray(m.content) ? m.content : []));
  const plugins = parts.some(p => p.type === 'file')
    ? [{ id: 'file-parser', pdf: { engine: 'cloudflare-ai' } }]
    : [];
  return plugins;
}

export function sanitizeAttachments(attachments = [], images = []) {
  if (!Array.isArray(attachments) || !Array.isArray(images))
    throw new Error('Attachments must be a list.');
  const items = [...attachments, ...images.map(src => ({ src, kind: 'image' }))];
  if (items.length > 2) throw new Error('Attach up to two files per message.');
  let total = 0;
  return items.map(item => {
    const src = typeof item?.src === 'string' ? item.src : '';
    const name = String(item?.name || 'attachment').slice(0, 120);
    total += src.length;
    if (total > 8_000_000) throw new Error('Attachments are too large. Use files under 3 MB each.');
    const match = src.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) throw new Error('This file could not be read. Try attaching it again.');
    const [, mime, data] = match;
    if (/^image\/(png|jpeg|webp|gif)$/.test(mime))
      return { type: 'image_url', image_url: { url: src }, modality: 'image' };
    if (/^audio\/(wav|x-wav|mpeg|mp3|ogg|flac|aac|mp4)$/.test(mime)) {
      const format =
        { mpeg: 'mp3', 'x-wav': 'wav', mp4: 'm4a' }[mime.split('/')[1]] || mime.split('/')[1];
      return { type: 'input_audio', input_audio: { data, format }, modality: 'audio' };
    }
    if (/^video\/(mp4|webm|mpeg|quicktime)$/.test(mime))
      return { type: 'video_url', video_url: { url: src }, modality: 'video' };
    if (mime === 'application/pdf')
      return { type: 'file', file: { filename: name, file_data: src }, modality: 'text' };
    if (['text/plain', 'text/markdown', 'text/csv', 'application/json'].includes(mime)) {
      if (data.length > 100_000) throw new Error('Text files must be under 75 KB.');
      const text = new TextDecoder().decode(Uint8Array.from(atob(data), c => c.charCodeAt(0)));
      return {
        type: 'text',
        text: `Attached file: ${name}\n<document>\n${text}\n</document>`,
        modality: 'text',
      };
    }
    throw new Error('Supported files: images, WAV/MP3 audio, MP4/WebM video, PDF, and text.');
  });
}

/** Hosted speech generation is paid; device speech remains available. */
export async function getSpeechAvailability(_env) {
  return false;
}
