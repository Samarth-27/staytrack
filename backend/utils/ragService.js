// backend/utils/ragService.js
const KnowledgeDocument = require('../models/KnowledgeDocument');
const aiClient = require('./geminiClient');

function cosineSimilarity(A, B) {
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < A.length; i++) {
    dotProduct += A[i] * B[i];
    normA += A[i] * A[i];
    normB += B[i] * B[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const retrieveRelevantContext = async (query) => {
  try {
    let topDocs = [];

    // Attempt Semantic Search if aiClient is ready
    if (aiClient) {
      try {
        const embedResponse = await aiClient.models.embedContent({
          model: 'gemini-embedding-2',
          contents: query
        });
        const queryVector = embedResponse.embeddings[0].values;
        
        const allDocs = await KnowledgeDocument.find({ embedding: { $exists: true, $ne: [] } });
        if (allDocs.length > 0) {
          allDocs.forEach(doc => {
            doc.simScore = cosineSimilarity(queryVector, doc.embedding);
          });
          allDocs.sort((a, b) => b.simScore - a.simScore);
          // Only keep docs with a reasonable semantic match (e.g. > 0.5)
          topDocs = allDocs.filter(d => d.simScore > 0.5).slice(0, 3);
        }
      } catch (embErr) {
        console.warn("Embedding generation failed, falling back to text search.", embErr.message);
      }
    }

    // Fallback to text search if semantic didn't yield results
    if (topDocs.length === 0) {
      topDocs = await KnowledgeDocument.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" } }).limit(3);
    }

    if (topDocs.length === 0) return "";

    let context = "--- RELEVANT HOSTEL KNOWLEDGE BASE INFO (SEMANTIC RAG) ---\n";
    topDocs.forEach(doc => {
      context += `[${doc.title}]: ${doc.content}\n`;
    });
    context += "-------------------------------------------\n";

    return context;
  } catch (error) {
    console.error("Error retrieving RAG context:", error);
    return "";
  }
};

module.exports = { retrieveRelevantContext };
