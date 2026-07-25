# AthliTech — Run & Setup Guide

This guide describes how to configure, build, run, and test the AthliTech V1 application components.

---

## Prerequisites

Before starting, ensure you have the following installed on your system:
1.  **Node.js** (v18.0 or later) & **npm** (v9.0 or later)
2.  **Python** (v3.12 or later)
3.  **MongoDB** (Local instance running on `mongodb://localhost:27017` or a MongoDB Atlas URI)

---

## 1. Backend Setup & Startup

### A. Environment Configuration
Navigate to the `backend/` directory and configure the environment variables:
1.  Copy the example env file:
    ```bash
    cp .env.example .env
    ```
2.  Open `.env` and set your MongoDB configuration:
    *   If using a single connection string:
        ```env
        MONGODB_URI=mongodb://localhost:27017/athlitech
        JWT_SECRET=your-secure-jwt-secret-key-here
        ```
    *   If using separate credentials:
        ```env
        MONGODB_USERNAME=your_username
        MONGODB_PASSWORD=your_password
        MONGODB_CLUSTER=your_cluster_address
        JWT_SECRET=your-secure-jwt-secret-key-here
        ```

### B. Activate Virtual Environment & Seed Database
Ensure you seed the default database roles and administrative/coaching profiles before starting the server.
```bash
cd backend
# Seed the MongoDB database with initial users & roles
venv/bin/python seed_users.py
```
*Note: This command seeds the dynamic roles collection and sets up default user accounts:*
*   **Admin**: `admin@athlitech.com` / `Admin@2024!`
*   **Coach**: `coach@athlitech.com` / `Coach#99ab`
*   **Athlete**: `athlete@athlitech.com` / `Athlete1$x`

### C. Start the Backend API
Run the local development server:
```bash
# Using the helper shell script from the workspace root:
./run-backend.sh

# Or running it manually from the backend directory:
venv/bin/uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
The API documentation will be available at:
*   Swagger Interactive Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
*   Alternative ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 2. Frontend Setup & Startup

### A. Install Dependencies
From the `frontend/` directory, install all required dependencies (including native Expo libraries):
```bash
cd frontend
npm install
```

### B. Set API Endpoint Address
Ensure that the frontend is pointed to your local backend API. If needed, configure the target API address:
```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
```

### C. Run the Expo Server
Start the Expo Metro Bundler:
```bash
npm run dev
# Or npx expo start
```
Once Metro Bundler starts, you can launch the app on your preferred platform:
*   Press **`w`** to launch on the Web browser (falls back to `localStorage` session storage).
*   Press **`a`** to launch on Android Emulator (uses native `expo-secure-store`).
*   Press **`i`** to launch on iOS Simulator (uses native `expo-secure-store`).

---

## 3. Verification & Testing

### Backend Unit Tests
Validate the FastAPI router integrations:
```bash
cd backend
PYTHONPATH=. venv/bin/pytest tests/ -v
```

### Frontend Code Linter
Verify file integrity and code imports:
```bash
cd frontend
npm run lint
```
