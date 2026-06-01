/**
 * Global error handler middleware for Express.
 * Catches all unhandled errors, formats them as JSON,
 * and provides special handling for Axios upstream errors.
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  // --- Axios errors (upstream API failures) ---
  if (err.response) {
    // The upstream server responded with a non-2xx status
    const status = err.response.status || 502;
    const message =
      err.response.data?.message ||
      err.response.data?.status_message ||
      err.message ||
      'Upstream API error';

    console.error(
      `[Upstream Error] ${status} — ${message} (${err.config?.url ?? 'unknown URL'})`
    );

    return res.status(status).json({
      error: true,
      message,
      source: err.config?.url ?? null,
    });
  }

  if (err.request) {
    // Request was made but no response received (timeout, DNS, etc.)
    console.error(
      `[Network Error] No response from ${err.config?.url ?? 'unknown URL'}: ${err.message}`
    );

    return res.status(504).json({
      error: true,
      message: 'Upstream service did not respond. Please try again later.',
    });
  }

  // --- Generic application errors ---
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  console.error(`[Server Error] ${status} — ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  return res.status(status).json({
    error: true,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : message,
  });
};

export default errorHandler;
