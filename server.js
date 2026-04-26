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


const PORT = process.env.PORT || 5000;

const ID_REGEX = /^\/movies\/([a-zA-Z0-9-]+)\/?$/;

const server = http.createServer(async (req, res) => {
   
    if (req.method === 'OPTIONS') {
        return sendResponse(res, 204, null);
    }

    
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname.replace(/\/+$/, ''); 
    const method = req.method;

    console.log(`[${new Date().toISOString()}] ${method} ${pathname}`);

    try {
       
        if (pathname === '/movies' || pathname === '') {
            if (method === 'GET') {
                let movies = await readData();

                
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

           
            if (method === 'POST') {
                let body;
                try {
                    body = await getRequestBody(req);
                } catch (err) {
                    return sendResponse(res, 400, { status: 'error', message: err.message });
                }

                
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

           
            return sendResponse(res, 405, { status: 'error', message: `Method ${method} not allowed on this endpoint` });
        }

        const match = pathname.match(ID_REGEX);
        if (match) {
            const movieId = match[1];
            const movies = await readData();
            const movieIndex = movies.findIndex(m => String(m.id) === movieId);

            if (movieIndex === -1) {
                return sendResponse(res, 404, { status: 'fail', message: `Movie with ID ${movieId} not found` });
            }

           
            if (method === 'GET') {
                return sendResponse(res, 200, { status: 'success', data: movies[movieIndex] });
            }

           
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

                
                const { isValid, error } = validateMovie(body, true);
                if (!isValid) {
                    return sendResponse(res, 400, { status: 'fail', message: error });
                }

              
                const updatedMovie = {
                    ...movies[movieIndex],
                    ...body,
                    updatedAt: new Date().toISOString()
                };

             
                if (updatedMovie.year) updatedMovie.year = Number(updatedMovie.year);
                if (updatedMovie.rating) updatedMovie.rating = Number(updatedMovie.rating);
                if (updatedMovie.title) updatedMovie.title = updatedMovie.title.trim();
                if (updatedMovie.director) updatedMovie.director = updatedMovie.director.trim();

                movies[movieIndex] = updatedMovie;
                await writeData(movies);

                return sendResponse(res, 200, { status: 'success', data: updatedMovie });
            }

          
            if (method === 'DELETE') {
                movies.splice(movieIndex, 1);
                await writeData(movies);
                return sendResponse(res, 200, { status: 'success', message: 'Movie successfully deleted' });
            }

           
            return sendResponse(res, 405, { status: 'error', message: `Method ${method} not allowed on this endpoint` });
        }

     
        return sendResponse(res, 404, { 
            status: 'error', 
            message: `Route ${pathname} not found on this server` 
        });

    } catch (error) {
     
        console.error('🔥 Server Error:', error);
        return sendResponse(res, 500, { 
            status: 'error', 
            message: 'Internal Server Error',
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
});


const shutdown = () => {
    console.log('\nClosing HTTP server...');
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);


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
