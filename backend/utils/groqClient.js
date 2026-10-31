// backend/utils/groqClient.js
const Groq = require('groq-sdk');

// Support GROQ_API_KEY as primary, with fallback to GEMINI_API_KEY if the user pasted it there
const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;
let rawGroq = null;

if (apiKey && apiKey.trim().length > 0) {
  try {
    rawGroq = new Groq({ apiKey: apiKey.trim() });
    console.log('✅ Groq Client Initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Groq Client:', error.message);
  }
} else {
  console.warn('⚠️ GROQ_API_KEY is missing. AI features will not work until an API key is provided.');
}

/**
 * Adapter that provides both direct access to Groq SDK
 * and an interface compatible with existing AI service calls.
 */
const groqClient = {
  raw: rawGroq,
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
              messages.push({
                role: 'assistant',
                content: null,
                tool_calls: [{
                  id: `call_${Math.random().toString(36).substring(2, 9)}`,
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

      // 3. Resolve Target Groq Model
      // Use Llama 3.2 Vision for image OCR; Llama 3.3 70B Versatile for high-reasoning tasks
      let targetModel = 'llama-3.3-70b-versatile';
      if (hasVision) {
        targetModel = 'llama-3.2-11b-vision-preview';
      } else if (model && model.includes('8b')) {
        targetModel = 'llama-3.1-8b-instant';
      }

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

      // 7. Execute Request on Groq
      const completion = await rawGroq.chat.completions.create(payload);
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
     * Groq focuses on ultra-fast chat & vision LLMs. If an embedding is requested,
     * we return empty vector so RAG automatically falls back to MongoDB full-text search.
     */
    embedContent: async () => {
      return { embeddings: [{ values: [] }] };
    }
  }
};

module.exports = groqClient;
