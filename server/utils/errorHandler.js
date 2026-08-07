/**
 * Centralized Express error handler.
 * Must be the LAST middleware registered in index.js.
 */
export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || (typeof err === 'string' ? err : 'Internal Server Error');

  console.error('\n============================================================');
  console.error('❌ [EXPRESS ERROR HANDLER DIAGNOSTIC LOG]:');
  console.error(`   - HTTP Status: ${status}`);
  console.error(`   - Error Message: ${message}`);
  console.error(`   - Error Code: ${err.code || 'N/A'}`);
  console.error(`   - Stack Trace:\n${err.stack || 'No stack trace available'}`);
  console.error('============================================================\n');

  // Handle Multer file size limit error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File size exceeds the maximum 100 MB upload limit. Please upload a smaller file.' });
  }

  // Return EXACT error message from Gemini API or internal service without masking
  res.status(status).json({
    error: message,
    code: err.code || status,
    timestamp: new Date().toISOString()
  });
};
