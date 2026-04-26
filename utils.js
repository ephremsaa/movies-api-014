const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataFilePath = path.join(__dirname, 'movies.json');

turns {Promise<Array>} Parsed array of movies.

const readData = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(dataFilePath, 'utf8', (err, data) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    return resolve([]); 
                }
                return reject(err);
            }
            if (!data || data.trim() === '') {
                return resolve([]);
            }
            try {
                resolve(JSON.parse(data));
            } catch (parseError) {
                reject(new Error('Corrupt data file: Invalid JSON'));
            }
        });
    });
};


const writeData = (data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
};


const generateId = () => {
    return crypto.randomUUID();
};


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

    
    const allowedFields = ['title', 'director', 'year', 'rating'];
    const extraFields = Object.keys(movie).filter(key => !allowedFields.includes(key));
    if (extraFields.length > 0) {
         return { isValid: false, error: `Payload contains unexpected fields: ${extraFields.join(', ')}` };
    }

    return { isValid: true, error: null };
};


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


const sendResponse = (res, statusCode, payload) => {
   
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
