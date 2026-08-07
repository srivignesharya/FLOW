import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

// Multi-key list for high availability and quota rotation
const getApiKeys = () => {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean);

  if (keys.length === 0) {
    console.error('\n❌ [FATAL CONFIG ERROR]: GEMINI_API_KEY environment variable is missing!');
    console.error('   Please add GEMINI_API_KEY to your server/.env or cloud environment (Render/Vercel).\n');
    throw new Error('GEMINI_API_KEY environment variable is missing. Get one at https://aistudio.google.com/apikey');
  }
  return keys;
};

let currentKeyIndex = 0;

export const getAiInstance = () => {
  const keys = getApiKeys();
  const apiKey = keys[currentKeyIndex % keys.length];
  console.log("Gemini key prefix:", process.env.GEMINI_API_KEY?.substring(0, 8));
  return new GoogleGenAI({ apiKey });
};

export const rotateAiKey = () => {
  const keys = getApiKeys();
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;
  console.warn(`🔄 [GEMINI KEY ROTATION]: Switched to API Key Slot ${currentKeyIndex + 1}/${keys.length}`);
  return getAiInstance();
};

export const ai = getAiInstance();

export const FLASH_MODEL = 'gemini-2.5-flash';
export const PRO_MODEL = 'gemini-2.5-flash';
export const FALLBACK_MODEL = 'gemini-2.5-flash';

// ============================================================
// SYSTEM INSTRUCTIONS
// ============================================================
export const SYSTEM_INSTRUCTION = `
You are Flow AI, an elite academic intelligence agent.
Your job is to extract academic commitments from documents, screenshots, announcements, and raw text.

Rules:
- Analyze implied dates (e.g., "due next Friday", "submission by end of week") using the reference date supplied.
- NEVER invent tasks not present in the source material.
- Categorize priority strictly:
  * 'high': Exams, major projects (>15% weight), or due within 48 hours.
  * 'medium': Regular assignments, quizzes, lab reports, projects <15%.
  * 'low': General circulars, optional reading, administrative notices.
- estimatedMinutes should reflect realistic study/completion time.
- Output MUST strictly conform to the JSON schema provided — no extra commentary.
`;

// ============================================================
// STRUCTURED OUTPUT SCHEMAS
// ============================================================

/**
 * Schema for task extraction from uploaded documents / pasted text
 */
export const taskExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Short, descriptive task title' },
          subject: { type: Type.STRING, description: 'Academic subject or course name' },
          deadline: {
            type: Type.STRING,
            description: 'ISO 8601 formatted date-time string (YYYY-MM-DDTHH:mm:ssZ)'
          },
          weightage: {
            type: Type.NUMBER,
            description: 'Percentage contribution towards final grade. 0 if unknown.'
          },
          priority: {
            type: Type.STRING,
            enum: ['critical', 'high', 'medium', 'low']
          },
          reasoning: {
            type: Type.STRING,
            description: 'Explainable AI justification for why this priority and estimated duration were assigned.'
          },
          estimatedMinutes: {
            type: Type.INTEGER,
            description: 'Realistic estimated completion time in minutes'
          },
          description: {
            type: Type.STRING,
            description: 'Brief description of what the task requires'
          },
          taskType: {
            type: Type.STRING,
            enum: ['assignment', 'exam', 'announcement', 'reading']
          }
        },
        required: ['title', 'subject', 'deadline', 'priority', 'reasoning', 'estimatedMinutes', 'description', 'taskType']
      }
    }
  },
  required: ['tasks']
};

/**
 * Schema for AI-generated 7-day study plan
 */
export const studyPlanSchema = {
  type: Type.OBJECT,
  properties: {
    scheduleSummary: {
      type: Type.STRING,
      description: 'Overall strategy and key highlights for this study plan'
    },
    dailyPlans: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, description: 'Day label, e.g. "Monday, Aug 7"' },
          dateIso: { type: Type.STRING, description: 'YYYY-MM-DD date string' },
          totalAllocatedMinutes: { type: Type.INTEGER },
          blocks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: 'Unique block ID, e.g. block-1' },
                taskId: { type: Type.STRING, description: 'Corresponding task UUID from input data' },
                taskTitle: { type: Type.STRING },
                subject: { type: Type.STRING },
                startTime: { type: Type.STRING, description: 'Suggested start time, e.g. "09:00 AM"' },
                endTime: { type: Type.STRING, description: 'Suggested end time, e.g. "10:30 AM"' },
                durationMinutes: { type: Type.INTEGER },
                priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                focusGoal: {
                  type: Type.STRING,
                  description: 'Specific learning goal for this study block'
                },
                completed: { type: Type.BOOLEAN }
              },
              required: ['id', 'taskTitle', 'subject', 'startTime', 'endTime', 'durationMinutes', 'priority', 'focusGoal']
            }
          }
        },
        required: ['day', 'dateIso', 'totalAllocatedMinutes', 'blocks']
      }
    }
  },
  required: ['scheduleSummary', 'dailyPlans']
};
