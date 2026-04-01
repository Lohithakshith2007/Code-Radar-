# Code Radar

## Description
The Code Complexity Analyzer is a full stack web application that helps developers analyze the quality and complexity of their code.  
Users can paste code into an interactive editor, and the system provides insights such as complexity level, code quality score, and improvement suggestions.

This project is designed as a simple AI-assisted tool to demonstrate code analysis and modern full stack development.

---

## Features

- Code Complexity Analysis  
  Calculates basic complexity using conditions and loops.

- Code Quality Score  
  Displays a rating (Low, Medium, High) based on complexity.

- AI Suggestions  
  Provides suggestions to improve code readability and structure.

- Interactive Code Editor  
  Built using Monaco Editor with syntax highlighting.

- Full Stack Architecture  
  Frontend built with React and backend powered by Django REST API.

- Real-Time Analysis  
  Instantly analyzes code and displays results.

---

## How It Works

1. User enters or pastes code into the editor  
2. Frontend sends the code to the backend API  
3. Backend analyzes:
   - Number of lines  
   - Control structures (if, loops, etc.)  
4. A complexity score is calculated  
5. Suggestions are generated and sent back  
6. Results are displayed on the UI  

---

## Tech Stack

- Frontend: React (Vite)
- Backend: Django + Django REST Framework
- Editor: Monaco Editor
- AI (optional): Gemini / OpenAI API

---

## Running the Project

### Frontend
```powershell
cd frontend
npm run dev
```

### Backend
```powershell
cd backend
python manage.py runserver