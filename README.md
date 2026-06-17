# Project Race

A full-stack mobile application for activity tracking and team competitions. Built with React Native (Expo) for the frontend and ASP.NET Core Web API for the backend, with PostgreSQL as the database.

## Tech Stack

**Frontend:** React Native, Expo SDK 56, TypeScript  
**Backend:** ASP.NET Core Web API, C#, .NET 10  
**Database:** PostgreSQL (Neon.tech cloud)  
**Authentication:** JWT tokens, BCrypt password hashing  
**ORM:** Entity Framework Core  

## Features

- User registration and login with JWT authentication
- Activity tracking with distance logging and personal statistics
- Friend system with search, requests, and acceptance flow
- Global leaderboard showing top 10 runners
- Competition management with invitations and role-based access
- Tier system for classifying participants by fitness level
- Snake draft algorithm for balanced team randomization
- Role management: Main Administrator, Administrator, Participant
- Profile pages with activity summary and competition history
- Interactive map showing user location

## Project Structure
project-race/

├── project-race-frontend/     # React Native + Expo application

│   └── src/

│       ├── screens/           # All application screens

│       ├── components/        # Reusable components

│       ├── services/          # API service layer

│       └── constants/         # Theme and color definitions

└── project-race-backend-csharp/   # ASP.NET Core Web API

├── Controllers/           # API endpoints

├── Models/                # Database models

└── ProjectRaceContext.cs  # Entity Framework configuration

## API Endpoints

**Auth:** POST /api/auth/register, POST /api/auth/login  
**Activities:** POST /api/activities, GET /api/activities/user/{id}  
**Friends:** GET /api/friends/user/{id}, POST /api/friends/request, PUT /api/friends/accept/{id}  
**Leaderboard:** GET /api/leaderboard  
**Competitions:** POST /api/competitions, GET /api/competitions/user/{id}, POST /api/competitions/invite  
**Teams:** POST /api/competitions/{id}/randomize-teams  
**Users:** GET /api/users/search, GET /api/users/{id}  

