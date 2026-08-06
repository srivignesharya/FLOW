import { ai, FLASH_MODEL } from './gemini.js';

/**
 * Perform Vision OCR extraction on scanned PDFs and images using Gemini Multimodal Vision API.
 * Preserves structural formatting, tabular data, and handwritten text notes.
 */
export const performVisionOcr = async (fileBuffer, mimeType) => {
  try {
    console.log(`👁️ [VISION OCR]: Extracting text from ${mimeType} buffer (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)...`);
    const base64Data = fileBuffer.toString('base64');

    const prompt = `Perform high-precision Vision OCR text extraction on this document image/page. Preserve all structural headings, table data, handwritten notes, deadlines, and grade weightages. Return the full extracted text string cleanly.`;

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt }
          ]
        }
      ]
    });

    const extractedText = response.text || '';
    console.log(`✅ [VISION OCR SUCCESS]: Extracted ${extractedText.length} characters of text.`);
    return extractedText;
  } catch (err) {
    console.error(`❌ [VISION OCR ERROR]:`, err.message);
    return '';
  }
};

export default performVisionOcr;
