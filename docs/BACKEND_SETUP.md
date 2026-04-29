# Backend Setup Guide for Locate Me

This guide explains how to set up the backend API for the Locate Me application.

## Quick Start

The frontend expects a backend API running on `http://localhost:5000`. When you create a location via the "Get Location" button:

1. The frontend captures your coordinates using the browser's Geolocation API
2. It sends the data to the backend API (`POST /api/locations`)
3. The location is saved in the database
4. The marker appears on the map automatically

## Environment Configuration

The frontend is configured to connect to the backend via:

```
NEXT_PUBLIC_BE_URL=http://localhost:5000
```

This is set in `.env.local`. Change the URL if your backend runs on a different host/port.

## API Endpoints

### Core Endpoints

- **POST /api/locations** - Create a new location
- **GET /api/locations** - Retrieve all locations
- **GET /api/locations/:id** - Get a specific location
- **PUT /api/locations/:id** - Update a location
- **DELETE /api/locations/:id** - Delete a location

See [API.md](./API.md) for detailed documentation.

## Example Backend Implementation (Node.js/Express)

Here's a minimal backend example to get you started:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:3002',
  credentials: true
}));

app.use(express.json());

// In-memory storage (replace with a database in production)
const locations = {};

// Create location
app.post('/api/locations', (req, res) => {
  const { latitude, longitude, accuracy, timestamp, description } = req.body;
  
  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  const id = `loc_${Date.now()}`;
  const location = {
    id,
    latitude,
    longitude,
    accuracy: accuracy || 0,
    timestamp: timestamp || new Date().toISOString(),
    description: description || '',
    createdAt: new Date().toISOString()
  };

  locations[id] = location;
  res.status(201).json(location);
});

// Get all locations
app.get('/api/locations', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  
  const allLocations = Object.values(locations);
  const paginated = allLocations.slice(offset, offset + limit);

  res.json({
    locations: paginated,
    total: allLocations.length,
    limit,
    offset
  });
});

// Get location by ID
app.get('/api/locations/:id', (req, res) => {
  const location = locations[req.params.id];
  if (!location) {
    return res.status(404).json({ error: 'Location not found' });
  }
  res.json(location);
});

// Update location
app.put('/api/locations/:id', (req, res) => {
  const location = locations[req.params.id];
  if (!location) {
    return res.status(404).json({ error: 'Location not found' });
  }

  if (req.body.description !== undefined) {
    location.description = req.body.description;
  }

  res.json(location);
});

// Delete location
app.delete('/api/locations/:id', (req, res) => {
  if (locations[req.params.id]) {
    delete locations[req.params.id];
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Location not found' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
```

### Setup

1. Create a new directory for your backend:
   ```bash
   mkdir locate_me_backend
   cd locate_me_backend
   ```

2. Initialize Node project:
   ```bash
   npm init -y
   npm install express cors
   ```

3. Create `server.js` with the code above

4. Start the backend:
   ```bash
   node server.js
   ```

5. Your backend should be running on `http://localhost:5000`

## Testing the Integration

1. Start the frontend:
   ```bash
   npm run dev  # Runs on http://localhost:3002
   ```

2. Start the backend (in another terminal):
   ```bash
   node server.js  # Runs on http://localhost:5000
   ```

3. In your browser, go to `http://localhost:3002`

4. Click the "Get Location" button on the right sidebar

5. Grant location permission when prompted

6. You should see:
   - A location marker appear on the map
   - The "Locations Found" counter increment
   - The accuracy metric update

## Production Deployment

For production, you'll want to:

1. **Use a real database** (PostgreSQL, MongoDB, etc.)
2. **Add authentication** (JWT, OAuth)
3. **Enable proper CORS** with your domain
4. **Add input validation** on all endpoints
5. **Implement error handling**
6. **Add logging and monitoring**
7. **Use HTTPS** in production

## Database Schema (Example - PostgreSQL)

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy INTEGER,
  description TEXT,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_timestamp ON locations(timestamp DESC);
```

## Troubleshooting

### Frontend shows "NEXT_PUBLIC_BE_URL is not configured"
- Ensure `.env.local` exists with `NEXT_PUBLIC_BE_URL=http://localhost:5000`
- Restart the frontend dev server after changing `.env.local`

### Frontend can't connect to backend
- Verify backend is running on the correct port
- Check CORS is enabled in your backend
- Look for errors in browser console (Network tab)

### Locations don't appear on map
- Check browser console for errors
- Verify the backend is returning data correctly
- Test the API with curl:
  ```bash
  curl http://localhost:5000/api/locations
  ```

### Geolocation permission denied
- The browser needs HTTPS for geolocation (localhost is an exception)
- In Firefox: Settings > Privacy > Permissions > Location - check allowed sites
- In Chrome: Settings > Privacy and security > Site Settings > Location

## Next Steps

- Integrate with a real database
- Add authentication for multi-user support
- Implement route tracking (distance calculation)
- Add real-time location updates (WebSocket)
- Create location sharing features
