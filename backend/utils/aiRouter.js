// backend/utils/aiRouter.js
const aiClient = require('./geminiClient');
const { getSessionMemory, addMessageToMemory } = require('./aiMemoryService');
const { retrieveRelevantContext } = require('./ragService');

/**
 * Central AI Agent Router
 * @param {string} prompt - The user's input
 * @param {object} user - The user object (must contain _id and role)
 * @param {string} sessionId - The session identifier for memory
 */
const processAIRequest = async (prompt, user, sessionId) => {
  if (!aiClient) {
    throw new Error('AI Client is not initialized.');
  }

  // Fast pre-check for pure arithmetic or common math queries like "5+3", "what is 5+3", etc.
  const trimmedPrompt = (prompt || '').trim();
  const isMathQuery = /^(what\s+is\s+|calculate\s+|solve\s+)?[\d\s\+\-\*\/\^\%\(\)\.\=]+\??$/i.test(trimmedPrompt) && 
                      (/[\+\-\*\/\^\%]/.test(trimmedPrompt) || /^\d+$/.test(trimmedPrompt));

  if (isMathQuery) {
    const refusal = "Please do not ask these questions here. I am the StayTrack Hostel Copilot and can only assist with hostel-related queries (such as your room, maintenance, fee payments, complaints, and hostel management).";
    await addMessageToMemory(user._id, sessionId, 'user', prompt);
    await addMessageToMemory(user._id, sessionId, 'assistant', refusal);
    return refusal;
  }

  // 1. Retrieve Memory
  const pastMessages = await getSessionMemory(user._id, sessionId);

  // 1.5 Retrieve Knowledge Base Context (RAG)
  const ragContext = await retrieveRelevantContext(prompt);

  // 2. Build Context based on role with STRICT Domain Guardrails
  let systemPrompt = `You are the StayTrack Enterprise AI Operating System Copilot for Sanmati Bhavan Hostel. You are an Agentic AI acting exclusively on the hostel database.\n`;
  systemPrompt += `Current Date: ${new Date().toISOString()}\n`;
  systemPrompt += `Current User: ${user.name} (Role: ${user.role})\n`;
  
  systemPrompt += `
[CRITICAL SECURITY & SCOPE GUARDRAILS]
You are EXCLUSIVELY the StayTrack Hostel Copilot.
Your ONLY purpose is to assist users with StayTrack hostel operations, room maintenance, fee payments, complaints, and official hostel policies.

STRICT REFUSAL RULES:
1. You MUST NEVER answer off-topic or general-purpose questions. This includes, but is not limited to:
   - General mathematics, arithmetic, or calculations (e.g. "5+3", "what is 10/2", "solve equations", etc.)
   - Coding, programming, debugging, or script generation
   - General trivia, history, science, geography, weather, politics, religion, sports, entertainment
   - Homework, essay writing, translation of unrelated texts, creative stories, jokes, recipes
   - Casual chit-chat unrelated to the hostel
2. When the user asks ANY question outside of StayTrack hostel operations, or asks for general math / unrelated help, you MUST STRICTLY respond with this EXACT refusal message:
   "Please do not ask these questions here. I am the StayTrack Hostel Copilot and can only assist with hostel-related queries (such as your room, maintenance, fee payments, complaints, and hostel management)."
3. Do NOT provide the answer. Do NOT calculate the math. Do NOT apologize. ONLY output the refusal response.
`;

  if (ragContext) {
    systemPrompt += `\n[KNOWLEDGE BASE (RAG)]\n${ragContext}\n[END KNOWLEDGE BASE]\nUse this for policy/rules if relevant.\n`;
  }

  if (user.role === 'warden') {
    systemPrompt += `
[PERSONA: WARDEN AI COPILOT]
You act as the Hostel Operations Manager.
ALLOWED ACTIONS: Student Search, Room Allocation, Vacant/Occupied Rooms, Student History, Fee Verification, Pending Payments, Approve/Reject Payments, Complaint Management, Service Polls, Assign Staff, Analytics.
STRICTLY BLOCKED: Profit, Business Revenue, Owner Financial Analytics, Investment Suggestions, Business Expansion, Cross Hostel Analytics, or any non-hostel general questions.
If asked about blocked items, politely deny access.
You can execute actions like "allocateRoom" and "approvePayment" using your tools.
Always be professional, operational, and concise.`;
  } else if (user.role === 'owner') {
    systemPrompt += `
[PERSONA: OWNER AI COPILOT]
You act as the CEO Dashboard and Executive Assistant.
ALLOWED ACTIONS: Revenue, Expenses, Profit, Occupancy, Vacancy, Business Analytics, Revenue Forecast, Maintenance Cost, Complaint Trends, Executive Reports, Growth Analysis, Branch Comparison, Investment Suggestions, Future Forecasting.
STRICTLY BLOCKED: Any non-hostel general knowledge, math, coding, or unrelated queries.
Use your tools to fetch Revenue Stats, Business Summaries, and Revenue Forecasts.
Be executive, analytical, and visionary in your tone. Provide actionable business insights.`;
  } else {
    systemPrompt += `
[PERSONA: STUDENT AI COPILOT]
You act as a personal hostel assistant for ${user.name}.
ALLOWED ACTIONS: My Fees, My Payments, My Complaints, Complaint Status, My Room, My Profile, Hostel Rules, Mess Menu, Leave Request Status, Service Polls.
STRICTLY BLOCKED: Other Students, Vacant Rooms, Revenue, Analytics, Pending Fees (global), Complaint Statistics (global), Occupancy, Staff Details, Warden/Owner Data, or any non-hostel general questions.
If asked about blocked items, politely deny access stating you only have access to their personal data.
You can use tools to fetch their personal payments, complaints, or raise new complaints.
Always be helpful, friendly, and concise.`;
  }

  systemPrompt += `\n\nHALLUCINATION PREVENTION: Never invent names, numbers, payments, revenue, reports, or complaints. Always fetch from MongoDB via your tools. If data doesn't exist, say "I couldn't find this information in the system."`;

  systemPrompt += `\n\nERROR HANDLING MANDATE:
Whenever any operation or tool returns an error, or if required details are missing from the user's input:
You MUST respond using this exact format:
"You have encountered an error: [state the specific error or missing detail]. Please correct your details ([state exactly what needs to be provided or corrected]) and try again."`;

  // 3. Prepare full conversation context for Gemini
  // In the genai SDK, we construct contents array.
  let contents = pastMessages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  // Add the current prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  try {
    // 4. Set up tools
    const { toolDefinitions, executeTool } = require('./aiTools');
    
    // 5. Call LLM (using the latest Google GenAI SDK interface)
    let response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        tools: [{ functionDeclarations: toolDefinitions }]
      }
    });

    // Multi-step reasoning loop (max 5 iterations to prevent infinite loops)
    let maxIterations = 5;
    
    while (response.functionCalls && response.functionCalls.length > 0 && maxIterations > 0) {
      maxIterations--;
      
      const call = response.functionCalls[0];
      console.log(`🤖 AI is calling tool: ${call.name}`);
      
      const toolResult = await executeTool(call.name, call.args, user);
      
      // Append the function call and result to contents
      contents.push({
        role: 'model',
        parts: [{ functionCall: call }]
      });
      
      contents.push({
        role: 'user',
        parts: [{
          functionResponse: {
            name: call.name,
            response: toolResult
          }
        }]
      });

      // Call LLM again to synthesize the final response or decide next tool
      response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          tools: [{ functionDeclarations: toolDefinitions }]
        }
      });
    }

    if (maxIterations === 0) {
      console.warn('⚠️ AI Router reached maximum function call iterations.');
    }

    const reply = response.text;

    // 6. Store in Memory
    await addMessageToMemory(user._id, sessionId, 'user', prompt);
    await addMessageToMemory(user._id, sessionId, 'assistant', reply);

    return reply;
  } catch (error) {
    console.error('Error processing AI request:', error);
    const errorMsg = `You have encountered an error: ${error.message || 'Unable to process your request'}. Please correct your details and try again.`;
    try {
      await addMessageToMemory(user._id, sessionId, 'assistant', errorMsg);
    } catch (_) {}
    return errorMsg;
  }
};

module.exports = {
  processAIRequest
};
