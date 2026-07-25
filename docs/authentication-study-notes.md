whata# AthliTech Authentication Study Notes

## Project Summary

AthliTech is being built as a full-stack athlete management application.

So far, the project has:

- A FastAPI backend.
- MongoDB Atlas database connection using Motor.
- User registration.
- User login.
- bcrypt password hashing.
- JWT token generation.
- Protected backend routes.
- Expo Router frontend.
- Web login page.
- Web register page.
- JWT token storage on successful login.
- Protected dashboard page.

The current authentication flow is a strong production-style foundation.

## What We Built

### User Registration

The register page allows a new user to create an account using:

- Name
- Email
- Password
- Role, currently defaulting to `athlete`

Frontend route:

```text
/register
```

Backend endpoint:

```text
POST /auth/register
```

The backend stores the user in MongoDB with a hashed password. The original password is never saved.

### User Login

The login page allows an existing user to sign in using:

- Email
- Password

Frontend route:

```text
/
```

Backend endpoint:

```text
POST /auth/login
```

If credentials are correct, the backend returns a JWT access token.

### Protected Dashboard

The dashboard is protected. The frontend checks whether a JWT token exists and verifies it with the backend.

Frontend route:

```text
/dashboard
```

Backend endpoint used for verification:

```text
GET /auth/me
```

If the token is invalid or missing, the user is redirected back to login.

## Authentication Flow

1. User creates an account on `/register`.
2. Frontend sends account details to `/auth/register`.
3. Backend hashes the password using bcrypt.
4. Backend stores the user in MongoDB Atlas.
5. Frontend logs the user in using `/auth/login`.
6. Backend verifies the password using bcrypt.
7. Backend creates a JWT token.
8. Frontend stores the JWT token in browser `localStorage`.
9. User is redirected to `/dashboard`.
10. Dashboard verifies the token using `/auth/me`.

## Technologies Used

### FastAPI

FastAPI is the backend web framework used to build API endpoints.

Why we use it:

- It is fast.
- It supports async code.
- It automatically generates Swagger API docs.
- It works well with Pydantic schemas.
- It is commonly used for modern Python APIs.

Where used:

```text
backend/main.py
backend/routes/
```

Interview explanation:

> We used FastAPI to build a modular REST API with authentication routes, protected routes, and automatic Swagger documentation.

### Motor

Motor is the async MongoDB driver for Python.

Why we use it:

- The mentor required Motor instead of PyMongo.
- It supports async database operations.
- It fits well with FastAPI's async architecture.

Where used:

```text
backend/database/mongodb.py
```

Interview explanation:

> We used Motor because FastAPI supports async request handling, and Motor allows non-blocking MongoDB operations.

### MongoDB Atlas

MongoDB Atlas is the cloud-hosted MongoDB database.

Why we use it:

- It stores users and athlete data.
- It is cloud-based.
- It is suitable for deployment-ready applications.

Collections currently used:

```text
users
athletes
```

Interview explanation:

> MongoDB Atlas stores application data in cloud collections. In this project, users are stored in the `users` collection and athletes are stored in the `athletes` collection.

### Pydantic

Pydantic validates incoming request data.

Why we use it:

- It checks email format.
- It validates required fields.
- It keeps API input clean and predictable.

Where used:

```text
backend/schemas/auth_schema.py
backend/models/
```

Interview explanation:

> We used Pydantic schemas to validate request bodies before they reach the service layer.

### bcrypt

bcrypt hashes user passwords.

Why we use it:

- Passwords should never be stored as plain text.
- bcrypt adds salt automatically.
- It is designed for secure password storage.

Where used:

```text
backend/core/security.py
```

Interview explanation:

> We hash passwords with bcrypt during registration and verify the plain login password against the stored hash during login.

### JWT

JWT means JSON Web Token.

Why we use it:

- It allows stateless authentication.
- The backend does not need to store login sessions.
- The frontend can send the token with protected API requests.

Where used:

```text
backend/core/security.py
```

Interview explanation:

> After successful login, the backend creates a JWT containing the user's email and role. The frontend stores it and sends it as a Bearer token for protected routes.

### python-jose

python-jose creates and verifies JWT tokens.

Why we use it:

- It signs access tokens.
- It verifies token validity.
- It detects invalid or expired tokens.

Interview explanation:

> We used python-jose for JWT encoding and decoding in the FastAPI backend.

### Environment Variables

Environment variables keep secrets outside source code.

Examples:

```text
SECRET_KEY
MONGO_URL
ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES
FRONTEND_ORIGINS
```

Why we use them:

- Secrets should not be committed to GitHub.
- Deployment environments can use different values.
- It keeps the project secure and configurable.

Interview explanation:

> Sensitive configuration like MongoDB URL and JWT secret are loaded from `.env`, not hardcoded in source code.

### CORS

CORS controls which frontend origins can access the backend.

Where used:

```text
backend/main.py
```

Why we use it:

- The frontend and backend run on different ports.
- Browser requests need backend permission.

Interview explanation:

> We configured CORS so the Expo web frontend can call the FastAPI backend during development.

### Expo Router

Expo Router handles frontend navigation.

Why we use it:

- It provides file-based routing.
- It works for web and mobile.
- It makes routes like `/register` and `/dashboard` easy to create.

Where used:

```text
app/
```

Interview explanation:

> We used Expo Router to build the login, register, and dashboard pages using file-based routing.

### React Native

React Native is used to build the frontend UI.

Why we use it:

- It can target mobile and web.
- It uses reusable components.
- It fits the Expo ecosystem.

Interview explanation:

> The frontend is built with React Native components through Expo, allowing the app to support web now and mobile later.

### localStorage

localStorage stores the JWT token in the browser.

Where used:

```text
services/auth.ts
```

Why we use it:

- It persists the token after page refresh.
- It lets the frontend remember that the user is logged in.

Interview note:

> For a production web app, we may later consider secure HTTP-only cookies. For this stage, localStorage is simple and acceptable for learning the flow.

## Architecture Used

The backend follows modular architecture:

```text
core/       configuration and security
database/   MongoDB connection
models/     data models
routes/     API route definitions
schemas/    request and response validation
services/   business logic
utils/      helper functions
```

Why this matters:

- Routes stay clean.
- Business logic stays in services.
- Security functions stay reusable.
- Database logic is separated.
- The code is easier to test and maintain.

Interview explanation:

> We separated routes, services, schemas, database, and security code to follow production-style backend architecture.

## Where To See Users And Data

### In MongoDB Atlas

To see users:

1. Open MongoDB Atlas.
2. Go to your cluster.
3. Click Browse Collections.
4. Open the database:

```text
athlitech
```

5. Open the collection:

```text
users
```

You should see fields like:

```text
_id
name
email
hashed_password
role
```

Important:

- You will not see the real password.
- You should only see `hashed_password`.
- That is correct and secure.

To see athletes:

```text
athlitech -> athletes
```

### In Swagger

Swagger runs from the backend:

```text
http://127.0.0.1:8000/docs
```

If using the alternate verification port:

```text
http://127.0.0.1:8010/docs
```

Swagger lets you test:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- Athlete routes

For protected routes, click Authorize and paste:

```text
Bearer YOUR_ACCESS_TOKEN
```

## What To Learn Next

### Backend Topics

- REST APIs
- HTTP methods: GET, POST, PUT, DELETE
- HTTP status codes
- FastAPI routing
- FastAPI dependencies
- Pydantic validation
- Async and await in Python
- MongoDB document design
- Motor async queries
- Password hashing
- JWT authentication
- CORS
- Environment variables
- API error handling
- Project modularization

### Frontend Topics

- React components
- React state using `useState`
- React lifecycle using `useEffect`
- Form handling
- Fetch API
- Error handling in UI
- Expo Router navigation
- Protected routes
- Token storage
- Conditional rendering
- Responsive layouts

### Security Topics

- Password hashing vs encryption
- bcrypt salt
- JWT expiration
- Bearer token authentication
- Environment secrets
- OAuth basics
- Forgot password tokens
- HTTP-only cookies
- CORS risks

### Professional Career Topics

- Git and GitHub workflow
- Clean folder structure
- API documentation
- Debugging backend errors
- Debugging frontend errors
- Reading logs
- Writing README files
- Deployment basics
- Testing APIs with Swagger/Postman
- Database inspection in Atlas

## Upcoming Features

### Forgot Password

This needs:

- Forgot password endpoint.
- Reset token generation.
- Token expiry.
- Email service such as SMTP, SendGrid, or Resend.
- Reset password page.

We should not fake this feature because it involves real security.

### Google Login

This needs:

- Google OAuth setup.
- Google Client ID.
- Google Client Secret.
- Redirect URL.
- Backend OAuth verification.
- User creation or login based on Google email.

This should be added carefully with environment variables.

## Interview-Style Explanation

> AthliTech uses a FastAPI backend with MongoDB Atlas. We use Motor for async database access, Pydantic for validation, bcrypt for password hashing, and JWT for authentication. The frontend is built with Expo Router and React Native. Users can register, log in, receive a JWT token, and access a protected dashboard. The backend is modularized into routes, services, schemas, database, core security, and configuration, which makes the project cleaner and closer to production architecture.

## Simple Confidence Answer

If an interviewer asks what you built, say:

> I built the authentication module for AthliTech. It supports user registration, login, bcrypt password hashing, JWT generation, token storage on the frontend, and protected routes. The backend is built with FastAPI and Motor connected to MongoDB Atlas, while the frontend uses Expo Router and React Native.

