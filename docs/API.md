# Locate Me API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Endpoints

### 1. Create Location
**Create a new location marker**

```http
POST /locations
```

#### Request Body
```json
{
  "latitude": 3.1390,
  "longitude": 101.6869,
  "accuracy": 45,
  "timestamp": "2026-04-29T10:30:00Z",
  "country": "Malaysia",
  "state": "Selangor",
  "description": "Office location"
}
```

#### Response (200 OK)
```json
{
  "id": "loc_123456",
  "latitude": 3.1390,
  "longitude": 101.6869,
  "accuracy": 45,
  "timestamp": "2026-04-29T10:30:00Z",
  "country": "Malaysia",
  "state": "Selangor",
  "description": "Office location",
  "createdAt": "2026-04-29T10:30:00Z"
}
```

#### Error Response (400)
```json
{
  "error": "Invalid coordinates",
  "message": "Latitude must be between -90 and 90"
}
```

---

### 2. Get All Locations
**Retrieve all saved locations**

```http
GET /locations
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Maximum results (default: 50) |
| offset | number | No | Pagination offset (default: 0) |

#### Response (200 OK)
```json
{
  "locations": [
    {
      "id": "loc_123456",
      "latitude": 3.1390,
      "longitude": 101.6869,
      "accuracy": 45,
      "timestamp": "2026-04-29T10:30:00Z",
      "description": "Office location",
      "createdAt": "2026-04-29T10:30:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

---

### 3. Get Location by ID
**Retrieve a specific location**

```http
GET /locations/:id
```

#### Response (200 OK)
```json
{
  "id": "loc_123456",
  "latitude": 3.1390,
  "longitude": 101.6869,
  "accuracy": 45,
  "timestamp": "2026-04-29T10:30:00Z",
  "description": "Office location",
  "createdAt": "2026-04-29T10:30:00Z"
}
```

#### Error Response (404)
```json
{
  "error": "Not found",
  "message": "Location not found"
}
```

---

### 4. Update Location
**Update an existing location**

```http
PUT /locations/:id
```

#### Request Body
```json
{
  "description": "Updated description"
}
```

#### Response (200 OK)
```json
{
  "id": "loc_123456",
  "latitude": 3.1390,
  "longitude": 101.6869,
  "accuracy": 45,
  "timestamp": "2026-04-29T10:30:00Z",
  "description": "Updated description",
  "createdAt": "2026-04-29T10:30:00Z"
}
```

---

### 5. Delete Location
**Delete a location**

```http
DELETE /locations/:id
```

#### Response (204 No Content)
```
(empty body)
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 400 | Bad Request | Invalid input parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## Usage Examples

### JavaScript/TypeScript (Frontend)

```typescript
// Create a location
async function createLocation(latitude: number, longitude: number, accuracy: number) {
  const response = await fetch('http://localhost:5000/api/v1/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      latitude,
      longitude,
      accuracy,
      timestamp: new Date().toISOString(),
      description: 'Current location'
    })
  });
  return response.json();
}

// Get all locations
async function getAllLocations() {
  const response = await fetch('http://localhost:5000/api/v1/locations');
  return response.json();
}
```

### cURL

```bash
# Create location
curl -X POST http://localhost:5000/api/v1/locations \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 3.1390,
    "longitude": 101.6869,
    "accuracy": 45,
    "timestamp": "2026-04-29T10:30:00Z",
    "country": "Malaysia",
    "state": "Selangor",
    "description": "Office"
  }'

# Get all locations
curl http://localhost:5000/api/v1/locations

# Get specific location
curl http://localhost:5000/api/v1/locations/loc_123456

# Delete location
curl -X DELETE http://localhost:5000/api/v1/locations/loc_123456
```

---

## Frontend Behavior

The frontend automatically groups locations by **State** and derives `country`/`state` using reverse geocoding during check-in.

1. User taps **Check in**
2. Browser geolocation captures coordinates
3. Frontend reverse-geocodes coordinates (Nominatim/OpenStreetMap)
4. Frontend sends location payload to backend (`/api/v1/locations`)

The main page displays:
- **Map**: Pins all user locations
- **Past 10 Locations**: Most recent check-ins
- **Total by State**: Aggregated state counts

Example grouping display:
```
📍 Malaysia
   ├─ Selangor: 5 users
   ├─ Kuala Lumpur: 3 users
   └─ Johor: 2 users

📍 Singapore
   └─ Singapore: 1 user
```

## Supported Countries

Default countries (expandable):
- **Malaysia** (13 states)
- Singapore
- Brunei
- Thailand
- Indonesia

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Coordinates use WGS84 (EPSG:4326) projection
- Accuracy is measured in meters
- Country and State fields are **required** for grouping
- The API runs on port 5000 by default
- Frontend check-in is guarded by session + cookie to avoid duplicate clicks in one session
- Backoffice tools can generate random records and flush all records
