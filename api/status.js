import { chatService } from './chat-service.js';

export default function handler(req, res) {
  const enabledProviders = chatService.multiModelService.getEnabledProviders();
  const status = {
    grok: {
      available: enabledProviders.includes('grok'),
    },
    anthropic: {
      available: enabledProviders.includes('anthropic'),
    },
    perplexity: {
      available: enabledProviders.includes('perplexity'),
    },
    gemini: {
      available: enabledProviders.includes('gemini'),
    },
    huggingface: {
      available: enabledProviders.includes('huggingface'),
    },
  };

  res.status(200).json(status);
}