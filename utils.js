const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataFilePath = path.join(__dirname, 'movies.json');

// ---------------------------------------------------------
// File System Operations (Data Layer)
// ---------------------------------------------------------

/**
 * Reads data asynchronously from the JSON file.
 * @returns {Promise<Array>} Parsed array of movies.
 */
const readData = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(dataFilePath, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    return resolve([]); // File doesn't exist yet
                }
                return reject(err);
            }
            if (!data || data.trim() === '') {
                return resolve([]); // Handle completely empty file gracefully
            }
            try {
                resolve(JSON.parse(data));
            } catch (parseError) {
                reject(new Error('Corrupt data file: Invalid JSON'));
            }
        });
    });
};

/**
 * Writes data asynchronously to the JSON file.
 * @param {Array} data - Array of movies to write.
 * @returns {Promise<void>}
 */
const writeData = (data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};

// ---------------------------------------------------------
// Helper Utilities
// ---------------------------------------------------------

/**
 * Generates a realistic, cryptographically secure unique ID (UUID v4).
 */
const generateId = () => {
    return crypto.randomUUID();
};

/**
 * Validates a movie object payload.
 * @param {Object} movie - The movie payload.
 * @param {boolean} isPartial - If true, only validates provided fields (for PUT/PATCH).
 * @returns {Object} { isValid, error }
 */
const validateMovie = (movie, isPartial = false) => {
    if (!movie || typeof movie !== 'object') {
        return { isValid: false, error: 'Invalid JSON payload. Expected an object.' };
    }

    const { title, director, year, rating } = movie;

    if (!isPartial || title !== undefined) {
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return { isValid: false, error: 'Title is required and must be a valid non-empty string.' };
        }
    }

    if (!isPartial || director !== undefined) {
        if (!director || typeof director !== 'string' || director.trim() === '') {
            return { isValid: false, error: 'Director is required and must be a valid non-empty string.' };
        }
    }

    if (!isPartial || year !== undefined) {
        const currentYear = new Date().getFullYear();
        if (typeof year !== 'number' || year < 1888 || year > currentYear) {
            return { isValid: false, error: `Year must be a number between 1888 and ${currentYear}.` };
        }
    }

    if (!isPartial || rating !== undefined) {
        if (typeof rating !== 'number' || rating < 1 || rating > 10) {
            return { isValid: false, error: 'Rating must be a number between 1 and 10.' };
        }
    }

    // Check for unexpected fields
    const allowedFields = ['title', 'director', 'year', 'rating'];
    const extraFields = Object.keys(movie).filter(key => !allowedFields.includes(key));
    if (extraFields.length > 0) {
         return { isValid: false, error: `Payload contains unexpected fields: ${extraFields.join(', ')}` };
    }

    return { isValid: true, error: null };
};

/**
 * Parses the incoming request body asynchronously.
 * @param {import('http').IncomingMessage} req 
 * @returns {Promise<Object>}
 */
const getRequestBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(new Error('Invalid JSON payload'));
            }
        });
        req.on('error', (err) => reject(err));
    });
};

/**
 * Standardizes the HTTP JSON response and adds CORS headers.
 */
const sendResponse = (res, statusCode, payload) => {
    // Standard Headers (Realistic API includes CORS and caching prevention)
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store, max-age=0'
    };

    res.writeHead(statusCode, headers);
    res.end(JSON.stringify(payload));
};

module.exports = {
    readData,
    writeData,
    generateId,
    validateMovie,
    getRequestBody,
    sendResponse
};
