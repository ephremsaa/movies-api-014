const http = require('http');
const url = require('url');
const { 
    readData, 
    writeData, 
    generateId, 
    validateMovie, 
    getRequestBody, 
    sendResponse 
} = require('./utils');

// Use a dynamic port (fallback to 5000 to avoid port 3000 conflicts)
const PORT = process.env.PORT || 5000;

// Regular expression to match UUIDs and numeric IDs in the route
const ID_REGEX = /^\/movies\/([a-zA-Z0-9-]+)\/?$/;

const server = http.createServer(async (req, res) => {
    // Enable CORS preflight handling
    if (req.method === 'OPTIONS') {
        return sendResponse(res, 204, null);
    }

    // Parse the request URL to separate path and query parameters
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname.replace(/\/+$/, ''); // normalize trailing slash
    const method = req.method;

    console.log(`[${new Date().toISOString()}] ${method} ${pathname}`);

    try {
        // ---------------------------------------------------------
        // ROUTE: GET /movies
        // ---------------------------------------------------------
        if (pathname === '/movies' || pathname === '') {
            if (method === 'GET') {
                let movies = await readData();

                // Advanced Feature: Support simple query filtering (e.g. ?year=2010)
                const queryYear = parsedUrl.searchParams.get('year');
                if (queryYear) {
                    movies = movies.filter(m => m.year === parseInt(queryYear, 10));
                }

                return sendResponse(res, 200, {
                    status: 'success',
                    results: movies.length,
                    data: movies
                });
            }

            // ---------------------------------------------------------
            // ROUTE: POST /movies
            // ---------------------------------------------------------
            if (method === 'POST') {
                let body;
                try {
                    body = await getRequestBody(req);
                } catch (err) {
                    return sendResponse(res, 400, { status: 'error', message: err.message });
                }

                // Strict Validation
                const { isValid, error } = validateMovie(body, false);
                if (!isValid) {
                    return sendResponse(res, 400, { status: 'fail', message: error });
                }

                const movies = await readData();
                const newMovie = {
                    id: generateId(),
                    title: body.title.trim(),
                    director: body.director.trim(),
                    year: Number(body.year),
                    rating: Number(body.rating),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                movies.push(newMovie);
                await writeData(movies);

                return sendResponse(res, 201, { status: 'success', data: newMovie });
            }

            // Method Not Allowed for /movies
            return sendResponse(res, 405, { status: 'error', message: `Method ${method} not allowed on this endpoint` });
        }

        // ---------------------------------------------------------
        // ROUTE: GET | PUT | DELETE /movies/:id
        // ---------------------------------------------------------
        const match = pathname.match(ID_REGEX);
        if (match) {
            const movieId = match[1];
            const movies = await readData();
            const movieIndex = movies.findIndex(m => String(m.id) === movieId);

            if (movieIndex === -1) {
                return sendResponse(res, 404, { status: 'fail', message: `Movie with ID ${movieId} not found` });
            }

            // GET /movies/:id
            if (method === 'GET') {
                return sendResponse(res, 200, { status: 'success', data: movies[movieIndex] });
            }

            // PUT /movies/:id
            if (method === 'PUT') {
                let body;
                try {
                    body = await getRequestBody(req);
                } catch (err) {
                    return sendResponse(res, 400, { status: 'error', message: err.message });
                }

                if (Object.keys(body).length === 0) {
                    return sendResponse(res, 400, { status: 'fail', message: 'Request body cannot be empty' });
                }

                // Partial Validation (only validate fields provided)
                const { isValid, error } = validateMovie(body, true);
                if (!isValid) {
                    return sendResponse(res, 400, { status: 'fail', message: error });
                }

                // Merge existing movie with new updates
                const updatedMovie = {
                    ...movies[movieIndex],
                    ...body,
                    updatedAt: new Date().toISOString()
                };

                // Type casting for safety
                if (updatedMovie.year) updatedMovie.year = Number(updatedMovie.year);
                if (updatedMovie.rating) updatedMovie.rating = Number(updatedMovie.rating);
                if (updatedMovie.title) updatedMovie.title = updatedMovie.title.trim();
                if (updatedMovie.director) updatedMovie.director = updatedMovie.director.trim();

                movies[movieIndex] = updatedMovie;
                await writeData(movies);

                return sendResponse(res, 200, { status: 'success', data: updatedMovie });
            }

            // DELETE /movies/:id
            if (method === 'DELETE') {
                movies.splice(movieIndex, 1);
                await writeData(movies);
                return sendResponse(res, 200, { status: 'success', message: 'Movie successfully deleted' });
            }

            // Method Not Allowed for /movies/:id
            return sendResponse(res, 405, { status: 'error', message: `Method ${method} not allowed on this endpoint` });
        }

        // ---------------------------------------------------------
        // 404 FALLBACK
        // ---------------------------------------------------------
        return sendResponse(res, 404, { 
            status: 'error', 
            message: `Route ${pathname} not found on this server` 
        });

    } catch (error) {
        // Global Error Handler
        console.error('🔥 Server Error:', error);
        return sendResponse(res, 500, { 
            status: 'error', 
            message: 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
});

// Graceful Shutdown
const shutdown = () => {
    console.log('\nClosing HTTP server...');
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Auto-fallback port logic to guarantee the server starts
const startServer = (port) => {
    server.listen(port, () => {
        console.log(`🚀 Server running on http://localhost:${port}`);
        console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
        console.log('Press CTRL+C to stop');
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${port} is busy, trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('🔥 Server Failed to Start:', err);
        }
    });
};

startServer(PORT);
