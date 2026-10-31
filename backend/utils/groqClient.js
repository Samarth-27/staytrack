// backend/utils/groqClient.js
const Groq = require('groq-sdk');

// Support GROQ_API_KEY as primary, with fallback to GEMINI_API_KEY
// Strip accidental surrounding quotes or trailing whitespace
const rawKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY || '';
const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');
let rawGroq = null;

if (apiKey && apiKey.length > 0) {
  try {
    rawGroq = new Groq({ apiKey });
    console.log('✅ Groq Client Initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Groq Client:', error.message);
  }
} else {
  console.warn('⚠️ GROQ_API_KEY is missing. AI features will not work until an API key is provided.');
}

// In-memory cache for models discovered from the user's API key
let cachedModels = null;
let lastModelFetch = 0;

/**
 * Dynamically queries Groq's /models endpoint to find which models
 * are actually enabled and accessible on this specific API key.
 */
async function resolveBestModel(requestedModel, hasVision) {
  if (!rawGroq) return requestedModel || 'llama-3.1-8b-instant';

  try {
    const now = Date.now();
    // Cache available models list for 10 minutes to maintain high performance
    if (!cachedModels || (now - lastModelFetch) > 600000) {
      const listRes = await rawGroq.models.list();
      if (listRes && Array.isArray(listRes.data)) {
        cachedModels = listRes.data.map(m => m.id);
        lastModelFetch = now;
        console.log('📋 Groq models accessible on this API key:', cachedModels);
      }
    }

    if (cachedModels && cachedModels.length > 0) {
      // 1. If explicit GROQ_MODEL environment variable matches available models
      if (process.env.GROQ_MODEL && cachedModels.includes(process.env.GROQ_MODEL)) {
        return process.env.GROQ_MODEL;
      }

      // 2. If vision is required, find vision-capable models
      if (hasVision) {
        if (process.env.GROQ_VISION_MODEL && cachedModels.includes(process.env.GROQ_VISION_MODEL)) {
          return process.env.GROQ_VISION_MODEL;
        }
        const visionCandidate = cachedModels.find(m => m.includes('vision')) ||
                                cachedModels.find(m => m.includes('qwen') || m.includes('muse'));
        if (visionCandidate) return visionCandidate;
      }

      // 3. If requested model is accessible, use it
      if (requestedModel && cachedModels.includes(requestedModel)) {
        return requestedModel;
      }

      // 4. Match against preferred models in descending priority order
      const priorityCandidates = [
        'llama-3.1-8b-instant',
        'llama-3.3-70b-versatile',
        'llama-3.1-70b-versatile',
        'openai/gpt-oss-120b',
        'openai/gpt-oss-20b',
        'qwen/qwen3.8-27b',
        'minimaxai/minimax-m2.7',
        'mixtral-8x7b-32768',
        'gemma2-9b-it'
      ];

      for (const cand of priorityCandidates) {
        if (cachedModels.includes(cand)) {
          return cand;
        }
      }

      // 5. Fallback to any available LLM excluding audio/guard models
      const generalLlm = cachedModels.find(m => !m.includes('whisper') && !m.includes('guard'));
      if (generalLlm) return generalLlm;

      // 6. Return first model in list
      return cachedModels[0];
    }
  } catch (err) {
    console.warn('⚠️ Could not query Groq models list dynamically:', err.message);
  }

  // Safe static fallback
  return requestedModel || 'llama-3.1-8b-instant';
}

/**
 * Adapter that provides both direct access to Groq SDK
 * and an interface compatible with existing AI service calls.
 */
const groqClient = {
  raw: rawGroq,
  resolveBestModel,
  models: {
    /**
     * Generate content using Groq's high-speed inference engine
     */
    generateContent: async ({ model, contents, config = {} }) => {
      if (!rawGroq) {
        throw new Error('Groq Client is not initialized. Please ensure GROQ_API_KEY is configured in your environment.');
      }

      let messages = [];
      let hasVision = false;

      // 1. Add System Instruction if present
      if (config.systemInstruction) {
        messages.push({
          role: 'system',
          content: typeof config.systemInstruction === 'string' 
            ? config.systemInstruction 
            : JSON.stringify(config.systemInstruction)
        });
      }

      // 2. Parse contents into standard chat messages
      if (typeof contents === 'string') {
        messages.push({ role: 'user', content: contents });
      } else if (Array.isArray(contents)) {
        for (const item of contents) {
          const role = item.role === 'model' ? 'assistant' : (item.role || 'user');
          
          if (Array.isArray(item.parts)) {
            let textParts = [];
            let visionParts = [];
            let functionCallPart = null;
            let functionResponsePart = null;

            for (const part of item.parts) {
              if (part.text) {
                textParts.push(part.text);
              }
              if (part.inlineData) {
                hasVision = true;
                visionParts.push({
                  type: 'image_url',
                  image_url: {
                    url: `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`
                  }
                });
              }
              if (part.functionCall) {
                functionCallPart = part.functionCall;
              }
              if (part.functionResponse) {
                functionResponsePart = part.functionResponse;
              }
            }

            if (functionCallPart) {
              const callId = functionCallPart.id || `call_${Math.random().toString(36).substring(2, 9)}`;
              messages.push({
                role: 'assistant',
                content: null,
                tool_calls: [{
                  id: callId,
                  type: 'function',
                  function: {
                    name: functionCallPart.name,
                    arguments: JSON.stringify(functionCallPart.args || {})
                  }
                }]
              });
            } else if (functionResponsePart) {
              messages.push({
                role: 'user',
                content: `Tool Execution Result for ${functionResponsePart.name}:\n${JSON.stringify(functionResponsePart.response)}`
              });
            } else if (visionParts.length > 0) {
              messages.push({
                role: 'user',
                content: [
                  { type: 'text', text: textParts.join('\n') || 'Analyze this image.' },
                  ...visionParts
                ]
              });
            } else {
              messages.push({
                role: role,
                content: textParts.join('\n')
              });
            }
          } else if (item.content) {
            messages.push({ role: role, content: item.content });
          }
        }
      }

      // 3. Dynamically resolve the best model accessible on this API key
      const targetModel = await resolveBestModel(model, hasVision);

      // 4. Build Request Payload
      const payload = {
        model: targetModel,
        messages: messages,
        temperature: typeof config.temperature === 'number' ? config.temperature : 0.7
      };

      // 5. Handle JSON Object formatting if requested
      if (config.responseMimeType === 'application/json' || config.responseFormat === 'json') {
        payload.response_format = { type: 'json_object' };
        // Ensure prompt contains 'json' to satisfy Groq API requirements
        const hasJsonWord = messages.some(m => typeof m.content === 'string' && m.content.toLowerCase().includes('json'));
        if (!hasJsonWord) {
          const lastMsg = messages[messages.length - 1];
          if (typeof lastMsg.content === 'string') {
            lastMsg.content += '\nRespond strictly with a valid JSON object.';
          }
        }
      }

      // 6. Handle Function Tools if defined
      if (config.tools && Array.isArray(config.tools)) {
        const functionDeclarations = config.tools[0]?.functionDeclarations;
        if (Array.isArray(functionDeclarations) && functionDeclarations.length > 0) {
          payload.tools = functionDeclarations.map(fn => ({
            type: 'function',
            function: {
              name: fn.name,
              description: fn.description || '',
              parameters: fn.parameters || { type: 'object', properties: {} }
            }
          }));
          payload.tool_choice = 'auto';
        }
      }

      // 7. Execute Request on Groq with Automated Fallback Cascade
      let completion = null;
      try {
        completion = await rawGroq.chat.completions.create(payload);
      } catch (err) {
        const errMsg = (err && (err.message || '')) + '';
        const isModelError = err.status === 404 || 
                             err.code === 'model_not_found' || 
                             errMsg.includes('does not exist') ||
                             errMsg.includes('access to it');

        if (isModelError && cachedModels && cachedModels.length > 0) {
          // Select an alternative model from the cached available list
          const alternative = cachedModels.find(m => m !== payload.model && !m.includes('whisper') && !m.includes('guard'));
          if (alternative) {
            console.warn(`⚠️ Model '${payload.model}' rejected (${errMsg}). Retrying with alternative '${alternative}'...`);
            payload.model = alternative;
            if (hasVision) {
              for (let msg of payload.messages) {
                if (Array.isArray(msg.content)) {
                  const textOnly = msg.content.filter(p => p.type === 'text').map(p => p.text).join('\n');
                  msg.content = textOnly || 'Analyze the provided payment receipt details.';
                }
              }
            }
            completion = await rawGroq.chat.completions.create(payload);
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      const choice = completion.choices?.[0];
      const message = choice?.message || {};

      // 8. Extract Function Calls if returned
      let functionCalls = [];
      if (message.tool_calls && Array.isArray(message.tool_calls)) {
        for (const tc of message.tool_calls) {
          if (tc.type === 'function' && tc.function) {
            let parsedArgs = {};
            try {
              parsedArgs = JSON.parse(tc.function.arguments || '{}');
            } catch (e) {
              parsedArgs = {};
            }
            functionCalls.push({
              id: tc.id,
              name: tc.function.name,
              args: parsedArgs
            });
          }
        }
      }

      return {
        text: message.content || '',
        functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
        rawChoice: choice
      };
    },

    /**
     * Fallback for embedding requests:
     * Returns empty vector so RAG automatically falls back to MongoDB full-text search.
     */
    embedContent: async () => {
      return { embeddings: [{ values: [] }] };
    }
  }
};

module.exports = groqClient;
