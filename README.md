# Band App Frontend

Mobile-first React app for collaborative band documentation.

## Features

- 📱 Mobile-optimized responsive design
- 🎵 Real-time song syncing
- 🔊 Audio upload & playback
- 📝 Lyrics, chords, structure editing
- 🌙 Dark mode (always on)
- 📴 Works offline (with service workers)

## Setup

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file (or set in Netlify):

```
VITE_API_URL=http://localhost:3000/api
# In production (Netlify), this becomes:
# VITE_API_URL=https://your-railway-api.railway.app/api
```

## Deploy to Netlify

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourname/band-app-frontend
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "New site from Git"
   - Select your GitHub repo
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Set environment variable**
   - In Netlify dashboard → Site settings → Build & deploy → Environment
   - Add `VITE_API_URL` = your Railway API URL

4. **Deploy**
   - Netlify auto-deploys on every push to main

## Add to Home Screen (Mobile)

1. Open the app in your phone's browser
2. Tap the menu (⋮) → "Install app" (or "Add to Home Screen")
3. Opens like a native app

## File Structure

```
src/
  ├── pages/          # Route components
  ├── api.js          # API client
  ├── store.js        # Zustand state
  ├── App.jsx         # Router & auth
  └── index.css       # Global styles
```

## API Integration

All API calls go through `src/api.js`. It automatically:
- Adds JWT token to headers
- Points to `VITE_API_URL`
- Handles errors

Example:
```js
import { songsAPI } from './api';

const songs = await songsAPI.getAll();
```

## Notes

- Auth tokens stored in localStorage
- Dark mode is hardcoded (no toggle)
- Audio player uses native HTML5 `<audio>`
- Responsive breakpoints: mobile-first design
