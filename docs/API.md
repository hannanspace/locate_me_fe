# Locate Me API Documentation

## Base URL
```
http://localhost:5000/api
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
  const response = await fetch('http://localhost:5000/api/locations', {
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
  const response = await fetch('http://localhost:5000/api/locations');
  return response.json();
}
```

### cURL

```bash
# Create location
curl -X POST http://localhost:5000/api/locations \
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
curl http://localhost:5000/api/locations

# Get specific location
curl http://localhost:5000/api/locations/loc_123456

# Delete location
curl -X DELETE http://localhost:5000/api/locations/loc_123456
```

---

## Frontend Grouping

The frontend automatically groups locations by **Country → State**. When users tap "Get Location":

1. They fill in **Country** dropdown (defaults to Malaysia)
2. They select **State/Province** from the list
3. GPS coordinates are captured
4. Location is sent to backend with country and state

The right sidebar displays:
- **State Counters**: Shows how many users are in each state
- **Country Headers**: Groups states by country
- **Real-time Updates**: Counters refresh when new locations are added

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
- Frontend uses dropdowns for country/state (Malaysia default)
- Locations are grouped for analytics and reporting
