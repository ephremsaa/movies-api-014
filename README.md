# Movie Review REST API

A production-grade, realistic REST API for managing movie reviews built entirely using **Node.js Core Modules** (`http`, `fs`, `crypto`, and `url`). This project relies strictly on built-in modules without utilizing Express or any external libraries.

## 🚀 Realistic Features Added
- **Dynamic Port Assignment**: Avoids the common `EADDRINUSE: address already in use :::3000` error by checking `process.env.PORT` or falling back to `5000`.
- **CORS Handling**: Properly manages `OPTIONS` preflight requests and sends appropriate Cross-Origin headers.
- **Cryptographic UUIDs**: Uses the built-in `crypto.randomUUID()` for enterprise-grade unique IDs instead of `Math.random()`.
- **Advanced Query Parsing**: Supports filtering via URL query parameters (e.g. `GET /movies?year=2010`) using the built-in `url` module.
- **Strict & Partial Validations**: Rejects unexpected fields in the payload and ensures fields strictly match expected types, with a custom partial validator tailored for `PUT` operations.
- **Graceful Shutdown**: Properly catches `SIGINT` and `SIGTERM` signals to close the HTTP server safely.
- **Robust Error Handling**: Centralized `try-catch` blocks at the highest level of the request lifecycle, ensuring the server never crashes on bad input or broken code.

## 📁 Project Structure

```text
/movies-api-014
  ├── server.js        # Main application entry point, routing, and graceful shutdown
  ├── utils.js         # Core business logic (file ops, UUIDs, body parsing, CORS headers)
  ├── movies.json      # Persistent JSON storage database
  └── README.md        # API Documentation
```

