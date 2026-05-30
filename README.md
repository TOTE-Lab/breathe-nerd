# Breathe Nerd

Breathe Nerd is a low-friction breathing exercise web app for developers and people who work at computers. The goal is simple: open the app, breathe for a short guided exercise, and get back to work.

## Problem

Developers and computer-based workers often spend hours in high-stress, high-focus states without intentional recovery. When breaks do happen, they are often passive activities like scrolling or watching videos, which may not actually reset the nervous system.

Most wellness apps are too generic, too complicated, or require too much commitment to use in the middle of a work session. Breathe Nerd is designed for the specific moment when someone needs a short, structured reset without losing momentum.

## Solution

Breathe Nerd guides users through a short breathing exercise designed to help reset their nervous system during a work session.

The MVP focuses on authentication, protected routes, one guided breathing exercise, and a database prepared for future breathing-session tracking. Later stretch features can add mood check-ins, saved breathing-session history, and a personal dashboard.

## MVP Definition

The MVP is the smallest complete version of the app that proves the core idea: a logged-in user can access and complete one guided breathing exercise.

For this project, the MVP includes:

- User authentication with signup, login, logout, bcrypt password hashing, server-side auth sessions, and protected routes.
- A home or exercise page with one guided breathing technique, a timer, and a clean calming interface.
- A database prepared for future breathing-session tracking without building the full dashboard yet.

## Possible Features

Stretch features are optional improvements that should only be started after the MVP works end to end.

- Mood check-in where users rate stress from 1 to 10 before and after the exercise.
- Breathing-session saving to the database with user ID, timestamp, mood before, mood after, and duration.
- A personal dashboard showing breathing-session history, total breathing exercises completed, and average mood before vs. after.
- Chrome extension reminders that prompt users to take a breathing break at set intervals.
- Live breathing room showing how many other people are currently doing a breathing exercise.
- Multiple breathing exercises such as box breathing, 4-7-8 breathing, and physiological sigh.
- Streak tracking to encourage a consistent daily break habit.
- Pomodoro integration that pairs focused work blocks with breathing exercises.
- Advanced mood analytics showing trends over time, best days of the week, and long-term improvement.

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React, TypeScript, CSS |
| Backend | Node.js, Express |
| Authentication | bcrypt, server-side auth sessions |
| Database | Supabase PostgreSQL |
| Testing/API tools | Postman / Yaak |
| Version control | Git, GitHub |

## Getting Started

Use these steps to get a local prototype running.

1. Clone the repository and install dependencies from the repo root:

```bash
git clone https://github.com/breathe-nerd/breathe-nerd.git
cd breathe-nerd
npm install
```

2. Create a local `.env` file in the repo root. This file is ignored by Git and should not be committed.

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
SESSION_SECRET=replace_with_a_long_random_string
PORT=3000
```

3. Set up the Supabase database.

At minimum, the app needs the `users` table for signup and login. Use the schema in `docs/DATABASE_SCHEMA.md` as the source of truth.

4. Start the client and server together:

```bash
npm run dev
```

The Express server runs on `http://localhost:3000` by default. The Vite client runs on the local URL printed in the terminal, usually `http://localhost:5173`.

5. Optional checks before opening a pull request:

```bash
npm run type-check:server
npm run type-check:client
npm test
```

## Team

| Area | Owners | Focus |
| --- | --- | --- |

Example:

| Area | Owners | Focus |
| --- | --- | --- |
| Frontend | name | Breathing UI, auth modal, client-side state, styling |
| Backend | name | Auth routes, protected routes, Supabase queries, future breathing-session routes |

## MVP API Targets

The frontend and backend should agree on route names before building too far.

```text
POST /auth/signup
POST /auth/login
POST /auth/logout
GET /auth/verify
```

## Future Breathing-Session API Targets

These routes are stretch targets for tracking completed breathing exercises. They should not be confused with auth sessions.

```text
POST /breathing-sessions
GET /breathing-sessions
GET /breathing-sessions/stats
```

## Future Breathing-Session Data Model

Each completed breathing session could store:

```text
user_id
created_at
mood_before
mood_after
duration
```

## Repo Layout

```text
breathe-nerd/
|-- client/      # React + TypeScript frontend
|-- server/      # Node + Express backend
|-- docs/        # Planning docs and feature notes
|-- README.md
`-- PROJECT_BRIEF.md
```
For a more extensive scaffold see docs/architecture.md.


## Development Workflow

1. Create a branch from `dev` before starting a feature.
2. Build only the feature or task assigned to that branch.
3. Test the change locally or with Postman when applicable.
4. Before opening a pull request, pull the latest `dev` and merge it into your branch.
5. Push the branch to GitHub.
6. Open a pull request into `dev`.
7. Request review

```bash
git switch dev
git pull
git switch your-branch-name
git merge dev
```

## Project Milestones

1. Authentication works: users can sign up, log in, and log out.
2. Protected routes work: logged-in pages are blocked from unauthenticated users.
3. Breathing flow works without database saving.
4. Database is prepared for future breathing-session tracking.
5. UI is polished and edge cases are handled.
6. Stretch work starts after the MVP: mood check-in, breathing-session saving, and dashboard.






## HEAT CHICKEN ADDITION



## Wave Form - 
    Created a canvas element at the bottom of the screen using React's useRef function to access it directly 

    useRef
    creates a empty box (formatted like an object) that persists across re-renders


    canvasRef -> holds the actual canvas element on the page so you can draw on it directly without going through React

    analyserRef -> holds the AnalyserNode after the mic connects so draw() can read audio data from it 60 times per second

    dataArrayRef -> holds the 256 slot array that gets filled with fresh audio data every frame - represents the current waveForm


    On mount, useEffect sets up the the Web Audio API chain
    -> use getUserMedia to request mic permission
    -> use AudioContext to process the audio stream
    -> use AnalyzerNode to sit in the web Audio signal chain and read data passing through


    A requestAnimationFrame loop runs our draw() function 60 time per second, reading fresh mic data and drawing the layered wave shapes onto the canvas element - the wave amplitude scales with mic volume so they increase visually as user volume increases

    There is a clean up function returned from useEffect() that stops the draw loop and the mic when the user navigates away from the page




## Sessions Route
Created an Express router in sessions router file, with two routes (get & post)

POST route
-> receives the stress ratings from React in req.body, pulls the user ID from the session cookie via authentication middleware, and inserts a new row into the Supabase session table

GET route
-> queries all the session rows for that user, calculates the total sessions and average stress reduction ad a percentage, fetches last_login from the user's table in a second query, and returns all three as a JSON response



## StressRating Component




## Dashboard Component - 
React component used as a pop-up user dashboard on the main page

The component is given props of the user object and onClose function from the main file (App.tsx)

useEffect
fetches stats from the Express server, passing the session cookie so the server knows whose data to return 

useState
handles the loading state while waiting for a response - once data arrives the dashboard will display the user information 

Stats are calculate server side rather than in React so we are not sending raw database rows just to do math on them in the browser


## Tests




## Technical Challenges