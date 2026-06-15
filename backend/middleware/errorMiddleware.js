const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    const isProduction = process.env.NODE_ENV === 'production';

    // Always log the full error server-side (never suppress)
    console.error(`[ERROR] ${req.method} ${req.url} → ${statusCode}: ${err.message}`);
    if (err.stack && !isProduction) {
        console.error(err.stack);
    }

    // In production: never expose internal stack traces or file paths to clients
    res.status(statusCode).json({
        success: false,
        message: err.message || 'An unexpected error occurred',
        // Never send stack traces to clients in production
        stack: isProduction ? undefined : err.stack
    });
};

module.exports = { errorHandler };
