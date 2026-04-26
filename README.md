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

## 🛠️ How to Run

1. Clone or download this repository.
2. Open your terminal and navigate to the project directory:
   ```bash
   cd movies-api-014
   ```
3. Start the server using Node:
   ```bash
   node server.js
   ```
   *The server will start on port `5000` by default (or your custom `PORT` env variable).*

---

## 📡 API Endpoints & Examples

All requests and responses use the `application/json` format.

**Important for Windows Users:** If you are using PowerShell, the standard `curl` command is an alias for `Invoke-WebRequest` and works differently. Please use the **PowerShell** tab examples below, or use a tool like **Postman** or **Insomnia**.

### 1. Create a Movie
- **Method**: `POST`
- **URL**: `/movies`
- **Body**: Payload must ONLY include `title`, `director`, `year`, and `rating`.
  ```json
  {
    "title": "Inception",
    "director": "Christopher Nolan",
    "year": 2010,
    "rating": 9
  }
  ```
- **Bash (Mac/Linux)**:
  ```bash
  curl -X POST http://localhost:5000/movies \
       -H "Content-Type: application/json" \
       -d '{"title":"Inception", "director":"Christopher Nolan", "year":2010, "rating":9}'
  ```
- **PowerShell (Windows)**:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/movies" -Method Post -ContentType "application/json" -Body '{"title":"Inception", "director":"Christopher Nolan", "year":2010, "rating":9}'
  ```

### 2. Get All Movies (With optional Query Filtering)
- **Method**: `GET`
- **URL**: `/movies` or `/movies?year=2010`
- **Bash (Mac/Linux)**:
  ```bash
  curl "http://localhost:5000/movies?year=2010"
  ```
- **PowerShell (Windows)**:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/movies?year=2010" -Method Get
  ```

### 3. Get a Single Movie
- **Method**: `GET`
- **URL**: `/movies/:id`
- **PowerShell Example**:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/movies/1" -Method Get
  ```

### 4. Update a Movie (Strict Partial update)
- **Method**: `PUT`
- **URL**: `/movies/:id`
- **Body**: Only update what you need, strictly validated.
  ```json
  {
    "rating": 10
  }
  ```
- **PowerShell Example**:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/movies/1" -Method Put -ContentType "application/json" -Body '{"rating":10}'
  ```

### 5. Delete a Movie
- **Method**: `DELETE`
- **URL**: `/movies/:id`
- **PowerShell Example**:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/movies/1" -Method Delete
  ```
