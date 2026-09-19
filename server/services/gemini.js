import Groq from 'groq-sdk';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// ============================================================
// GROQ MULTI-KEY SUPPORT & ROTATION
// ============================================================
const getGroqApiKeys = () => {
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

let currentGroqKeyIndex = 0;

export const getAiInstance = () => {
  const keys = getGroqApiKeys();
  const apiKey = keys.length > 0 ? keys[currentGroqKeyIndex % keys.length] : 'missing-key';
  return new Groq({ apiKey });
};

export const rotateAiKey = () => {
  const keys = getGroqApiKeys();
  if (keys.length > 1) {
    currentGroqKeyIndex = (currentGroqKeyIndex + 1) % keys.length;
    console.warn(`🔄 [GROQ KEY ROTATION]: Switched to Key Slot ${currentGroqKeyIndex + 1}/${keys.length}`);
  }
  return getAiInstance();
};

// ============================================================
// GEMINI SDK & HIGH-CAPACITY FALLBACK
// ============================================================
const getGeminiApiKeys = () => {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2
  ].filter(Boolean);
  return keys;
};

let currentGeminiKeyIndex = 0;

export const hasGemini = () => getGeminiApiKeys().length > 0;

export const getGeminiClient = () => {
  const keys = getGeminiApiKeys();
  if (keys.length === 0) return null;
  const apiKey = keys[currentGeminiKeyIndex % keys.length];
  return new GoogleGenAI({ apiKey });
};

export const rotateGeminiKey = () => {
  const keys = getGeminiApiKeys();
  if (keys.length > 1) {
    currentGeminiKeyIndex = (currentGeminiKeyIndex + 1) % keys.length;
    console.warn(`🔄 [GEMINI KEY ROTATION]: Switched to Key Slot ${currentGeminiKeyIndex + 1}/${keys.length}`);
  }
  return getGeminiClient();
};

// Gemini Flash model for 1M context, high TPM & multimodal OCR
export const GEMINI_FLASH_MODEL = 'gemini-2.5-flash';

// Backward compatibility: export an object that supports Gemini operations (models.generateContent)
// or falls back to Groq client
export const ai = getGeminiClient() || getAiInstance();

// Current production models on Groq
export const FLASH_MODEL = 'openai/gpt-oss-120b';
export const PRO_MODEL = 'openai/gpt-oss-120b';
export const FALLBACK_MODEL = 'openai/gpt-oss-20b';

console.log(
  `🧠 [AI ENGINE INITIALIZED]: Groq Keys = ${getGroqApiKeys().length} | Gemini Available = ${hasGemini()} | Primary = ${PRO_MODEL} | Fallback = ${FALLBACK_MODEL} | High-Capacity = ${GEMINI_FLASH_MODEL}`
);

// ============================================================
// SYSTEM INSTRUCTIONS
// ============================================================
export const SYSTEM_INSTRUCTION = `
You are Flow AI, an elite academic intelligence agent built by IMV.
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

// Helper to determine if an error is a Groq TPM or rate limit error
export const isRateLimitOrSizeError = (err) => {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.statusCode;
  return (
    status === 413 ||
    status === 429 ||
    msg.includes('rate_limit_exceeded') ||
    msg.includes('request too large') ||
    msg.includes('tokens per minute') ||
    msg.includes('tpm') ||
    msg.includes('quota')
  );
};

// ============================================================
// UNIFIED RESILIENT AI COMPLETION ENGINE
// ============================================================
/**
 * Execute AI completion with hybrid routing:
 * - Direct Gemini 2.5 Flash for large documents (>12,000 chars) or when preferGemini=true
 * - Ultra-fast Groq for standard queries with automatic Gemini failover on 413/429/TPM limits
 */
export const callAiCompletion = async ({
  prompt = '',
  systemPrompt = SYSTEM_INSTRUCTION,
  messages = null,
  temperature = 0.1,
  preferGemini = false,
  jsonMode = false
}) => {
  const promptLength = prompt ? prompt.length : 0;
  const isLargeInput = promptLength > 12000;

  // 1. If input is large or explicitly requested, use Gemini (1M token context, high TPM)
  if ((preferGemini || isLargeInput) && hasGemini()) {
    console.log(`🚀 [AI ROUTING]: Routing to Gemini 2.5 Flash (Length: ${promptLength} chars, isLarge: ${isLargeInput})`);
    for (let geminiAttempt = 0; geminiAttempt < 2; geminiAttempt++) {
      try {
        const gemini = getGeminiClient();
        const contentText = prompt || (messages ? messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n') : '');
        const response = await gemini.models.generateContent({
          model: GEMINI_FLASH_MODEL,
          contents: contentText,
          config: {
            systemInstruction: systemPrompt,
            temperature,
            ...(jsonMode ? { responseMimeType: 'application/json' } : {})
          }
        });
        return response.text || '{}';
      } catch (geminiErr) {
        console.warn(`⚠️ [GEMINI ATTEMPT ${geminiAttempt + 1} FAILED]: ${geminiErr.message}`);
        if (geminiAttempt === 0) {
          rotateGeminiKey();
          await new Promise(r => setTimeout(r, 1200));
        } else {
          throw geminiErr;
        }
      }
    }
  }

  // 2. Groq Execution with retry and automatic Gemini fallback
  let lastError;
  const groqMessages = messages || [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];

  for (let attempt = 0; attempt < 3; attempt++) {
    const targetModel = attempt === 0 ? FLASH_MODEL : FALLBACK_MODEL;
    try {
      const activeAi = getAiInstance();
      const completion = await activeAi.chat.completions.create({
        model: targetModel,
        messages: groqMessages,
        temperature,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
      });
      return completion.choices[0]?.message?.content || '{}';
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ [GROQ ATTEMPT ${attempt + 1} FAILED]: ${err.message}`);

      // If it's a rate limit or TPM limit error and Gemini is available, fail over immediately
      if (isRateLimitOrSizeError(err) && hasGemini()) {
        console.log(`🔄 [AI ENGINE FAILOVER]: Groq TPM/Rate limit hit (${err.message}). Seamlessly failing over to Gemini 2.5 Flash...`);
        try {
          const gemini = getGeminiClient();
          const contentText = prompt || messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
          const response = await gemini.models.generateContent({
            model: GEMINI_FLASH_MODEL,
            contents: contentText,
            config: {
              systemInstruction: systemPrompt,
              temperature,
              ...(jsonMode ? { responseMimeType: 'application/json' } : {})
            }
          });
          return response.text || '{}';
        } catch (geminiFailErr) {
          console.error(`❌ [GEMINI FAILOVER ALSO FAILED]:`, geminiFailErr.message);
        }
      }

      rotateAiKey();
    }
  }

  // 3. Final safety net: If all Groq attempts failed, try Gemini before throwing
  if (hasGemini()) {
    console.log(`🛡️ [AI SAFETY NET]: All Groq attempts failed. Final attempt with Gemini 2.5 Flash...`);
    try {
      const gemini = getGeminiClient();
      const contentText = prompt || (messages ? messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n') : '');
      const response = await gemini.models.generateContent({
        model: GEMINI_FLASH_MODEL,
        contents: contentText,
        config: {
          systemInstruction: systemPrompt,
          temperature,
          ...(jsonMode ? { responseMimeType: 'application/json' } : {})
        }
      });
      return response.text || '{}';
    } catch (geminiFinalErr) {
      console.error(`❌ [FINAL GEMINI SAFETY NET FAILED]:`, geminiFinalErr.message);
    }
  }

  throw lastError || new Error('All AI providers failed to process request');
};

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
