/**
 * Centralized error handling middleware.
 * Must be registered LAST in server.js after all routes.
 */
export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected server error occurred.";

  console.error(`[Error] ${req.method} ${req.originalUrl} → ${status}: ${message}`);

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
