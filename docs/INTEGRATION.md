# Frontend-Backend Integration Guide

## Architecture Overview

```
┌─────────────────────┐
│   Browser (3002)    │
│  ┌───────────────┐  │
│  │ LocationTracker
│  │   (Sidebar UI)│  │
│  └────────┬──────┘  │
│           │         │
│  ┌────────▼──────┐  │
│  │  page.tsx     │  │
│  │  (State Mgmt) │  │
│  └────────┬──────┘  │
│           │         │
│  ┌────────▼──────┐  │
│  │  MapView      │  │
│  │  (Markers)    │  │
│  └───────────────┘  │
└──────────┬──────────┘
           │
           │ HTTP REST API
           │
┌──────────▼──────────┐
│  Backend (5000)     │
│  ┌───────────────┐  │
│  │ /api/v1/locations│
│  │   Endpoints   │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │   Database    │  │
│  └───────────────┘  │
└─────────────────────┘
```

## Data Flow

### 1. Creating a Location

```
User taps "Check in" button
    ↓
Geolocation API triggered
    ↓
Browser prompts for permission
    ↓
Permission granted → GPS coordinates captured
    ↓
handleCheckIn() in page.tsx called
    ↓
POST /api/v1/locations sent to backend
    Body: { latitude, longitude, accuracy, timestamp, country, state, description }
    ↓
Backend stores location in database
    ↓
Returns location object with ID
    ↓
Frontend updates state:
  - locations array updated
  - locationsFound counter incremented
  - accuracy metric updated
    ↓
MapView re-renders
    ↓
New marker added to map
    ↓
Toast notification shows success
```

### 2. Loading Existing Locations

```
Page loads (useEffect)
    ↓
getAllLocations() API call
    ↓
GET /api/v1/locations from backend (paginated loop)
    ↓
Backend returns paginated locations
    ↓
Frontend state updated with locations array
    ↓
MapViewWrapper receives locations prop
    ↓
MapView renders markers for each location
    ↓
Map auto-centers on first location (if exists)
```

## Component Communication

### page.tsx (Main Controller)
- Manages location and check-in state
- Handles geolocation + reverse geocoding flow
- Coordinates API calls with backend
- Passes data down to child components

### Main Page UI
- Displays map, past 10 locations, total by state, and check-in button
- Guards duplicate check-ins with sessionStorage + cookie
- No direct backend communication outside page-level handlers

### MapView (Left Side)
- Displays map and markers
- Renders markers from `locations` prop
- Shows location details in popups
- Renders all fetched locations as markers

### api.ts (API Client)
- Abstracts HTTP communication
- Handles errors and retries
- Returns typed responses
- Uses `NEXT_PUBLIC_BE_URL` environment variable

## Key Implementation Details

### Environment Configuration

```
# .env.local
NEXT_PUBLIC_BE_URL=http://localhost:5000
```

Why `NEXT_PUBLIC_` prefix?
- Makes variable accessible in browser
- Baked into bundle at build time
- Safe for public URLs (no secrets)

### API Client Pattern

```typescript
// lib/api.ts
export async function sendLocation(payload: LocationPayload): Promise<Location> {
  const beUrl = getBeUrl(); // Gets from NEXT_PUBLIC_BE_URL
  
  const response = await fetch(`${beUrl}/api/v1/locations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(...);
  return response.json();
}
```

### State Management Flow

```typescript
// page.tsx
const [locations, setLocations] = useState<Location[]>([]);
const [isCheckingIn, setIsCheckingIn] = useState(false);

// On load: fetch existing locations
useEffect(() => {
  const data = await getAllLocations();
  setLocations(data);
}, []);

// On check-in: create new location
const handleCheckIn = async () => {
  const geocode = await reverseGeocode(latitude, longitude);
  const newLocation = await sendLocation({
    latitude, longitude, country: geocode.country, state: geocode.state, ...
  });
  setLocations(prev => [newLocation, ...prev]); // Add newest first
};
```

## Error Handling

### Frontend Error Handling
- Geolocation errors caught and toasted
- API errors with fallback messages
- CORS errors blocked by browser (setup issue)
- Network timeouts with user feedback

### Backend Validation
- Latitude/longitude range validation
- Accuracy must be non-negative
- Timestamp must be valid ISO 8601
- Required fields checked

### Common Issues

1. **CORS Error**: Backend doesn't allow requests from frontend
   - Solution: Add `cors()` middleware with correct origin

2. **undefined Location**: Props not passed correctly
   - Solution: Check prop drilling: page.tsx → MapViewWrapper → MapView

3. **Stale Data**: Old locations don't update on new location
   - Solution: Ensure `setLocations(prev => [newLoc, ...prev])`

4. **Marker not showing**: Location in database but not on map
   - Solution: Verify API returns locations with correct lat/lng fields

## Performance Considerations

### Pagination
```typescript
// Fetch with limit/offset to avoid huge transfers
const data = await getAllLocations(); // Fetches all pages
```

### Lazy Loading
```typescript
// MapView only renders visible markers (Leaflet handles this)
// Popup content rendered on demand
```

### State Updates
```typescript
// Add new location to beginning (most recent first)
setLocations(prev => [newLocation, ...prev]);

// Don't refetch all locations after create
// Just add the returned location to state
```

## Testing the Integration

### Manual Testing

1. **Create Location**
   - Click "Check in" button
   - Check browser DevTools → Network tab
   - Verify POST request to `/api/v1/locations`
   - Verify response has id, latitude, longitude
   - Check marker appears on map

2. **Load Locations**
   - Refresh page
   - Check Network tab for GET `/api/v1/locations`
   - Verify all markers appear on map

3. **Error Cases**
   - Disconnect backend, try to create location
   - Should show toast error
   - Check browser console for error details

### API Testing with cURL

```bash
# Create location
curl -X POST http://localhost:5000/api/v1/locations \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 3.1390,
    "longitude": 101.6869,
    "accuracy": 50,
    "timestamp": "2026-04-29T10:30:00Z"
  }'

# Get all locations
curl http://localhost:5000/api/v1/locations

# Delete location
curl -X DELETE http://localhost:5000/api/v1/locations/loc_123456
```

## Deployment Checklist

- [ ] Backend API deployed and accessible
- [ ] CORS configured for production domain
- [ ] NEXT_PUBLIC_BE_URL updated to production URL
- [ ] Frontend rebuilt with new environment
- [ ] Test create/read/delete operations
- [ ] Monitor API error rates
- [ ] Set up database backups
- [ ] Enable HTTPS on both frontend and backend
- [ ] Add authentication/authorization
- [ ] Set up logging and monitoring

## Future Enhancements

1. **Real-time Updates**: WebSocket for live location tracking
2. **Routes**: Track distance between sequential locations
3. **Export**: Download location history as GeoJSON
4. **Sharing**: Share location with others via link
5. **Analytics**: Heatmap of visited locations
6. **Offline Support**: Service Worker caching
7. **Multi-user**: User accounts and permission system
