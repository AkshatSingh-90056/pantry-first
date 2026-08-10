# Pantry First 🍳

A full-stack recipe discovery web application that enables users to find recipes based on ingredients currently in their pantry. Built with React, Express, and the Spoonacular API.

## 🚀 Features

- **Ingredient Search:** Input available kitchen ingredients to retrieve relevant recipes.
- **Ingredient Breakdown:** Clear display of matched ingredients versus missing items needed.
- **Resilient UI:** Graceful image fallbacks for missing third-party CDN assets.
- **Direct Recipe Access:** One-click navigation to full preparation guides.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Axios, CSS
- **Backend:** Node.js, Express, CORS, Dotenv
- **API:** Spoonacular Food API

## 💻 Local Setup

### Prerequisites
- Node.js (v18+)
- NPM

### 1. Clone Repository
```bash
git clone [https://github.com/AkshatSingh-90056/pantry-first.git](https://github.com/AkshatSingh-90056/pantry-first.git)
cd pantry-first
```
2. Backend Setup
```bash
cd server
npm install
```
Create a .env file inside the server/ directory:
```bash
SPOONACULAR_API_KEY=your_api_key_here
```
Start the Express server:
```bash
node server.js
```
3. Frontend Setup
In a second terminal window:
```bash
cd client
npm install
npm run dev
```
Open http://localhost:5173 in your browser.
