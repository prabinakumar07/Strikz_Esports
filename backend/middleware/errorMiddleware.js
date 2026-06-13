const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Log trace to server console
    console.error(`[ERROR] ${req.method} ${req.url} - ${err.message}`);
    if (process.env.NODE_ENV !== 'production' && err.stack) {
        console.error(err.stack);
    }

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = { errorHandler };
