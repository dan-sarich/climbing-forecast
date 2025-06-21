# Climbing Forecast

Predict the climbing fun percentage based on a searched location's weather factors.

## Overview

This application helps climbers determine the best time to climb based on weather conditions. It analyzes temperature, wind, precipitation, and other factors to calculate a "climbing fun" percentage.

## Architecture

The application consists of two main components:

- **Backend**: A Nest.js REST API that fetches weather data from OpenWeatherMap and calculates climbing conditions
- **Frontend**: A Nuxt 3 web application that provides a user interface for viewing the climbing forecast

## Setup Instructions

### Prerequisites

- Node.js (v16.10 or later)
- npm (v7 or later) or yarn
- Git

### Backend Setup

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` and add your API keys:
   ```
   cp .env.example .env
   ```

4. Start the development server:
   ```
   npm run start:dev
   ```

The API will be available at http://localhost:5000/api

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Start the development server:
   ```
   npm run dev
   ```

The frontend will be available at http://localhost:3000

### Frontend Development Notes

- The frontend is built with Nuxt 3, which uses Vue 3 and the Composition API
- TypeScript is used for type safety
- Tailwind CSS is used for styling
- For more information on Nuxt 3, see the [Nuxt 3 documentation](https://nuxt.com/docs)
- For more information on Tailwind CSS, see the [Tailwind CSS documentation](https://tailwindcss.com/docs)

## Collaborators

Daniel Sarich <br />
Daniel Mazzone <br />
