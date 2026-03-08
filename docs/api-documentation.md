## API Documentation From Winter 2026


## API Documentation From Fall 2025

The web application exposes the following API endpoints:

### 1. Geocoding API

**Endpoint:** `GET /api/geocode`

**Description:** Geocodes a location name to coordinates using OpenCage API.

**Query Parameters:**
- `q` (required): Location name to geocode

**Example Request:**
```bash
GET /api/geocode?q=Elk Island Provincial Park
```

**Example Response:**
```json
{
  "latitude": 53.5731,
  "longitude": -112.8583
}
```

**Error Response:**
```json
{
  "error": "Missing q param"
}
```
Status: 400

**Rate Limits:**
- Limited by OpenCage API quota (2,500 requests/day on free tier)

---

### 2. Heatmap API

**Endpoint:** `GET /api/heatmap`

**Description:** Searches for sites matching a keyword and returns counts for heatmap visualization.

**Query Parameters:**
- `keyword` (optional): Search term to match against site names

**Example Request:**
```bash
GET /api/heatmap?keyword=park
```

**Example Response:**
```json
{
  "data": [
    {
      "namesite": "Elk Island Provincial Park",
      "count": 15
    },
    {
      "namesite": "Writing-on-Stone Provincial Park",
      "count": 12
    }
  ]
}
```

**Empty Response:**
```json
{
  "data": [],
  "message": "No sites found"
}
```

**Error Response:**
```json
{
  "error": "Database query failed"
}
```
Status: 400 or 500

**Authentication:**
- Requires authenticated user session (handled by middleware)

---

### 3. Authentication Endpoints

These endpoints are handled by Next.js and Supabase:

- `POST /login` - User login
- `POST /signup` - User registration
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/confirm` - Email confirmation handler

**Note:** These are internal API routes. Use the frontend login/signup pages instead of calling these directly.

---