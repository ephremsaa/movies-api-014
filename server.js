const http = require('http');
const { readData, writeData, sendJSON, parseBody, generateId } = require('./utils/helpers');

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
    const { method, url } = req;
    
    // Normalize URL to handle trailing slashes and query strings
    // e.g., '/movies/' -> '/movies', '/movies?sort=asc' -> '/movies'
    const basePath = url.split('?')[0].replace(/\/+$/, '') || '/';
    
    // Log the incoming request
    console.log(`[${new Date().toISOString()}] ${method} ${url} (mapped to ${basePath})`);

    // Set CORS headers if needed
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS
    if (method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    try {
        // --- 0️⃣ ROOT (GET /) ---
        if (method === 'GET' && basePath === '/') {
            return sendJSON(res, 200, {
                status: 'success',
                message: 'Welcome to the Movie Review API! Please use the /movies endpoint.'
            });
        }

        // --- 2️⃣ READ ALL (GET /movies) ---
        if (method === 'GET' && basePath === '/movies') {
            const movies = await readData();
            return sendJSON(res, 200, {
                status: 'success',
                data: movies
            });
        }

        // --- 3️⃣ READ ONE (GET /movies/:id) ---
        if (method === 'GET' && basePath.match(/^\/movies\/([a-zA-Z0-9]+)$/)) {
            const id = basePath.split('/')[2];
            const movies = await readData();
            const movie = movies.find(m => m.id === id);

            if (!movie) {
                return sendJSON(res, 404, {
                    status: 'error',
                    message: 'Movie not found'
                });
            }

            return sendJSON(res, 200, {
                status: 'success',
                data: movie
            });
        }

        // --- 1️⃣ CREATE (POST /movies) ---
        if (method === 'POST' && basePath === '/movies') {
            try {
                const body = await parseBody(req);
                const { title, director, year, rating } = body;

                // Validate missing fields
                if (!title || !director || !year || rating === undefined) {
                    return sendJSON(res, 400, {
                        status: 'error',
                        message: 'Missing required fields (title, director, year, rating)'
                    });
                }

                // Validate rating (1-10)
                if (typeof rating !== 'number' || rating < 1 || rating > 10) {
                    return sendJSON(res, 400, {
                        status: 'error',
                        message: 'Rating must be a number between 1 and 10'
                    });
                }

                const movies = await readData();
                const newMovie = {
                    id: generateId(),
                    title,
                    director,
                    year,
                    rating,
                    createdAt: new Date().toISOString() // Extra feature: timestamp
                };

                movies.push(newMovie);
                await writeData(movies); // Save to movies.json

                return sendJSON(res, 201, {
                    status: 'success',
                    data: newMovie
                });
            } catch (error) {
                // Catch invalid JSON parsing
                return sendJSON(res, 400, {
                    status: 'error',
                    message: 'Invalid JSON input'
                });
            }
        }

        // --- 4️⃣ UPDATE (PUT /movies/:id) ---
        if (method === 'PUT' && basePath.match(/^\/movies\/([a-zA-Z0-9]+)$/)) {
            const id = basePath.split('/')[2];
            
            try {
                const body = await parseBody(req);
                const movies = await readData();
                const movieIndex = movies.findIndex(m => m.id === id);

                if (movieIndex === -1) {
                    return sendJSON(res, 404, {
                        status: 'error',
                        message: 'Movie not found'
                    });
                }

                // Validate rating if it's provided
                if (body.rating !== undefined && (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 10)) {
                    return sendJSON(res, 400, {
                        status: 'error',
                        message: 'Rating must be a number between 1 and 10'
                    });
                }

                // Apply partial update, preserve id and createdAt
                const updatedMovie = {
                    ...movies[movieIndex],
                    ...body,
                    id: movies[movieIndex].id,
                    createdAt: movies[movieIndex].createdAt
                };

                movies[movieIndex] = updatedMovie;
                await writeData(movies);

                return sendJSON(res, 200, {
                    status: 'success',
                    data: updatedMovie
                });
            } catch (error) {
                return sendJSON(res, 400, {
                    status: 'error',
                    message: 'Invalid JSON input'
                });
            }
        }

        // --- 5️⃣ DELETE (DELETE /movies/:id) ---
        if (method === 'DELETE' && basePath.match(/^\/movies\/([a-zA-Z0-9]+)$/)) {
            const id = basePath.split('/')[2];
            const movies = await readData();
            const movieIndex = movies.findIndex(m => m.id === id);

            if (movieIndex === -1) {
                return sendJSON(res, 404, {
                    status: 'error',
                    message: 'Movie not found'
                });
            }

            // Remove movie from array
            movies.splice(movieIndex, 1);
            await writeData(movies);

            return sendJSON(res, 200, {
                status: 'success',
                message: `Movie with ID ${id} deleted successfully`
            });
        }

        // --- INVALID ROUTE (404 Not Found) ---
        return sendJSON(res, 404, {
            status: 'error',
            message: 'Route not found'
        });

    } catch (error) {
        // Handle unexpected server errors (500)
        console.error('Server error:', error);
        return sendJSON(res, 500, {
            status: 'error',
            message: 'Internal server error'
        });
    }
});

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📂 Data is stored in movies.json`);
    console.log(`Ready to handle requests!`);
});
