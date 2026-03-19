# HealSync SaaS - Production-Grade Healthcare Platform

HealSync is a B2B Healthcare SaaS platform designed for modern medical practices. It provides a comprehensive suite of tools for patient management, clinical analytics, and practice monitoring.

## 🚀 Features

- **Authentication**: Secure login flow with session persistence.
- **Dashboard**: Real-time overview of practice statistics and patient inflow.
- **Patient Management**: Efficiently manage patient records with searchable grid and list views.
- **Clinical Analytics**: In-depth insights into patient demographics and recovery rates using Recharts.
- **Patient Details**: Comprehensive view of patient vitals, medical history, and clinical notes.
- **Notifications**: Integrated Service Worker for push notifications.
- **State Management**: Lightweight and scalable state management with Zustand.
- **Modern UI**: Clean, responsive interface built with Tailwind CSS and Lucide icons.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Charts**: Recharts
- **Animations**: Motion
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📁 Project Structure

```bash
src/
├── app/                 # App-wide setup (stores, providers)
├── components/          # Reusable UI and Layout components
├── features/            # Feature-specific logic (auth, dashboard, etc.)
├── hooks/               # Custom React hooks
├── pages/               # Page components
├── services/            # External services (Firebase, SW)
├── types/               # TypeScript definitions
└── utils/               # Utility functions
```

## 🔐 Firebase Setup

To enable real Firebase Authentication:
1. Accept the Firebase terms in the AI Studio UI.
2. The `firebase-applet-config.json` will be automatically generated.
3. Update `src/services/firebase.ts` to use the config.
4. Replace mock login logic in `src/pages/Login.tsx` with Firebase Auth methods.

### Initial Setup
The first admin user must be promoted directly in the Firebase console.
1. Log in to the application for the first time.
2. Go to the Firestore database in the Firebase console.
3. Locate your user document in the `users` collection.
4. Set the `role` field to `'admin'`.
