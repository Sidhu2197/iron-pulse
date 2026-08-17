# Iron Pulse – Full Stack Fitness App

Iron Pulse is a full-stack fitness tracking application with:
- **Frontend**: React + Vite (`frontend`)
- **Backend**: Spring Boot + Spring Security + JPA (`spring-security1-master`)
- **Database**: MySQL

The app supports authentication, dashboard stats, workouts, food/meal planning, BMI calculation, and calorie prediction.

## Project Structure

- `frontend` – React client application
- `spring-security1-master` – Spring Boot REST API and security layer

## Features

- User signup/login and profile management
- Protected routes with session/basic auth flow
- Dashboard data for fitness tracking
- Workout logging and workout plan generation
- Food search, meal logging, meal summaries, and food plan generation
- BMI calculator
- Calorie prediction integration (external ML service)

## Prerequisites

Install these before running:

- **Node.js** 18+ (recommended)
- **Java** 17 (required by backend)
- **Maven** 3.9+ (or use the included Maven wrapper)
- **MySQL** running locally

## Backend Setup (Spring Boot)

Backend folder:
- `spring-security1-master`

### 1) Configure database

Edit:
- `spring-security1-master/src/main/resources/application.properties`

Set values for your local MySQL instance:
- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`

Default server port is:
- `8080`

### 2) Run backend

From `spring-security1-master`:

**Windows (cmd/PowerShell):**

```bash
mvnw.cmd spring-boot:run
```

or if Maven is installed globally:

```bash
mvn spring-boot:run
```

## Frontend Setup (React + Vite)

Frontend folder:
- `frontend`

### 1) Install dependencies

From `frontend`:

```bash
npm install
```

### 2) Run frontend

```bash
npm run dev
```

Frontend runs on:
- `http://localhost:5173`

Vite proxy is configured to forward API and OAuth routes to backend (`http://localhost:8080`).

## Running the Full App

Use **two terminals**:

1. Start backend in `spring-security1-master`
2. Start frontend in `frontend`

Then open:
- `http://localhost:5173`

## Available Frontend Scripts

From `frontend`:

- `npm run dev` – Start dev server
- `npm run build` – Build production bundle
- `npm run preview` – Preview production build

## Backend Notes

- Spring Boot version: `3.4.3`
- Java release target: `17`
- Uses Spring Security, OAuth2 client, and Spring Data JPA
- MySQL driver included as runtime dependency

## Troubleshooting

- If frontend cannot reach API, confirm backend is running on `8080`.
- If DB connection fails, verify MySQL credentials and DB name in backend properties.
- If port conflicts occur, change frontend port in `frontend/vite.config.js` or backend port in `application.properties`.

## Future Improvements

- Add `.env` examples for frontend and backend
- Add Docker setup for one-command local startup
- Add test and deployment documentation
