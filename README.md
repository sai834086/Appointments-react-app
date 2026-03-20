# My App - React + Vite

A modern React application built with Vite, featuring location-based services and partner management.

## 🚀 Features

- **Location Services**: Google Maps integration for city search and geolocation
- **Partner Management**: Browse and connect with business partners
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Real-time Search**: Autocomplete city suggestions

## 🛠️ Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd my-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   Copy the example environment file and configure your API keys:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:

   ```env
   # Backend API URL
   VITE_REACT_APP_API_URL=http://localhost:8010/appointments

   # Google Maps API Key (required for location features)
   # Get your API key from: https://console.cloud.google.com/google/maps-apis
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Google Maps API

This app requires a Google Maps API key with the following APIs enabled:

- Maps JavaScript API
- Geocoding API
- Places API

Get your API key from the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis).

### Google Maps Services

The app includes centralized Google Maps services in `src/api/authService.js`:

- `loadGoogleMapsScript()` - Loads the Google Maps JavaScript API
- `reverseGeocode(latitude, longitude)` - Converts coordinates to address
- `initializePlacesAutocomplete(inputElement, options)` - Sets up Places Autocomplete

### Environment Variables

| Variable                   | Description          | Required |
| -------------------------- | -------------------- | -------- |
| `VITE_REACT_APP_API_URL`   | Backend API base URL | Yes      |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key  | Yes      |

## 🏗️ Tech Stack

- **Frontend**: React 19, Vite
- **Styling**: CSS Modules
- **Icons**: FontAwesome, Lucide React
- **Maps**: Google Maps JavaScript API
- **HTTP Client**: Axios

## 📱 Features Overview

### Location Search

- Search cities with autocomplete
- Use current location with geolocation
- Reverse geocoding for precise location detection

### Partner Discovery

- Browse verified business partners
- Filter by location and service type
- Real-time partner data from backend API

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is private and proprietary.
