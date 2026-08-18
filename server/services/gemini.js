import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

// Multi-key support & fallback for Groq API
const getApiKeys = () => {
  const keys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3
  ].filter(Boolean);

  if (keys.length === 0) {
    console.error('\n❌ [FATAL CONFIG ERROR]: GROQ_API_KEY environment variable is missing!');
    console.error('   Please add GROQ_API_KEY to your server/.env or cloud environment (Render/Vercel).\n');
  }
  return keys;
};

let currentKeyIndex = 0;

export const getAiInstance = () => {
  const keys = getApiKeys();
  const apiKey = keys.length > 0 ? keys[currentKeyIndex % keys.length] : 'missing-key';
  return new Groq({ apiKey });
};

export const rotateAiKey = () => {
  const keys = getApiKeys();
  if (keys.length > 1) {
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    console.warn(`🔄 [GROQ KEY ROTATION]: Switched to Key Slot ${currentKeyIndex + 1}/${keys.length}`);
  }
  return getAiInstance();
};

export const ai = getAiInstance();

// Current ultra-fast production models on Groq
export const FLASH_MODEL = 'openai/gpt-oss-120b';
export const PRO_MODEL = 'openai/gpt-oss-120b';
export const FALLBACK_MODEL = 'openai/gpt-oss-20b';

console.log(`🧠 [AI ENGINE INITIALIZED]: Provider = Groq | Keys available = ${getApiKeys().length} | Primary = ${PRO_MODEL} | Fallback = ${FALLBACK_MODEL}`);

// ============================================================
// SYSTEM INSTRUCTIONS
// ============================================================
export const SYSTEM_INSTRUCTION = `
You are Flow AI, an elite academic intelligence agent powered by Groq Llama 3.3.
Your job is to extract academic commitments from documents, announcements, and text.

Rules:
- Analyze implied dates (e.g., "due next Friday", "submission by end of week") using the reference date supplied.
- NEVER invent tasks not present in the source material.
- Categorize priority strictly:
  * 'critical': Exams or major deadlines due within 24 hours.
  * 'high': Exams, major projects (>15% weight), or due within 48 hours.
  * 'medium': Regular assignments, quizzes, lab reports, projects <15%.
  * 'low': General circulars, optional reading, administrative notices.
- estimatedMinutes should reflect realistic study/completion time.
- Return ONLY valid raw JSON conforming to the requested schema. No markdown wrapping. No conversation.
`;

// Compatibility type enum helpers
export const Type = {
  OBJECT: 'OBJECT',
  ARRAY: 'ARRAY',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN'
};

export const taskExtractionSchema = {};
export const studyPlanSchema = {};
