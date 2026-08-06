/**
 * Centralized Express error handler.
 * Must be the LAST middleware registered in index.js.
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[SERVER ERROR]:', err?.message || err);

  // Handle Multer file size limit error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File size exceeds the maximum 100 MB upload limit. Please upload a smaller file.' });
  }

  // Handle Gemini API 429 Resource Exhausted / Quota errors
  const errStr = String(err?.message || err || '');
  if (
    err.status === 429 ||
    err.statusCode === 429 ||
    errStr.includes('429') ||
    errStr.includes('RESOURCE_EXHAUSTED') ||
    errStr.includes('Quota exceeded')
  ) {
    return res.status(429).json({
      error: 'Gemini API quota exceeded. Please try again later or use another API key.',
      timestamp: new Date().toISOString()
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString()
  });
};
