// backend/utils/aiMemoryService.js
const AIMemory = require('../models/AIMemory');

const getSessionMemory = async (userId, sessionId, limit = 10) => {
  try {
    const memory = await AIMemory.findOne({ userId, sessionId });
    if (!memory) return [];
    
    // Return last N messages
    return memory.messages.slice(-limit).map(m => ({
      role: m.role,
      content: m.content
    }));
  } catch (error) {
    console.error('Error fetching AI memory:', error);
    return [];
  }
};

const addMessageToMemory = async (userId, sessionId, role, content) => {
  try {
    let memory = await AIMemory.findOne({ userId, sessionId });
    
    if (!memory) {
      memory = new AIMemory({ userId, sessionId, messages: [] });
    }
    
    memory.messages.push({ role, content });
    
    // Keep memory bounded to avoid excessive document size
    if (memory.messages.length > 50) {
      memory.messages = memory.messages.slice(-50);
    }
    
    await memory.save();
  } catch (error) {
    console.error('Error saving AI memory:', error);
  }
};

module.exports = {
  getSessionMemory,
  addMessageToMemory
};
