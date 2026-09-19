/**
 * Sanitize error message to be human-readable and user-friendly.
 */
export const sanitizeErrorMessage = (rawMessage) => {
  if (!rawMessage || typeof rawMessage !== 'string') return 'An unexpected error occurred.';

  // Check if error contains stringified JSON from Groq/OpenAI/Gemini
  const jsonMatch = rawMessage.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed?.error?.message) {
        const innerMsg = parsed.error.message;
        if (
          innerMsg.includes('tokens per minute') ||
          innerMsg.includes('TPM') ||
          innerMsg.includes('Request too large')
        ) {
          return 'The document text is too large for a single AI request. Please try uploading a slightly smaller excerpt or syllabus.';
        }
        return innerMsg;
      }
    } catch (_) {}
  }

  if (
    rawMessage.includes('tokens per minute') ||
    rawMessage.includes('TPM') ||
    rawMessage.includes('Request too large')
  ) {
    return 'The document text is too large for a single AI request. Please try uploading a slightly smaller excerpt or syllabus.';
  }

  return rawMessage;
};

/**
 * Centralized Express error handler.
 * Must be the LAST middleware registered in index.js.
 */
export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const rawMessage = err.message || (typeof err === 'string' ? err : 'Internal Server Error');
  const cleanMessage = sanitizeErrorMessage(rawMessage);

  console.error('\n============================================================');
  console.error('❌ [EXPRESS ERROR HANDLER DIAGNOSTIC LOG]:');
  console.error(`   - HTTP Status: ${status}`);
  console.error(`   - Raw Message: ${rawMessage}`);
  console.error(`   - Sanitized:   ${cleanMessage}`);
  console.error(`   - Error Code:  ${err.code || 'N/A'}`);
  console.error('============================================================\n');

  // Handle Multer file size limit error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File size exceeds the maximum 100 MB upload limit. Please upload a smaller file.' });
  }

  // Return clean, informative error message
  res.status(status).json({
    error: cleanMessage,
    code: err.code || status,
    timestamp: new Date().toISOString()
  });
};
