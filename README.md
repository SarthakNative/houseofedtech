# AI-Powered Form Generator
Generate and share dynamic forms using AI (Google Gemini or mock), track submissions, and support image uploads via Cloudinary. Built with Next.js 16 + TypeScript frontend and Express + MongoDB backend.
## Live Link
https://ai-form-generator-application.vercel.app/

## Features

Authentication: Email/password registration and login with JWT

AI Form Generation: Convert natural language prompts into JSON form schemas

Dynamic Form Rendering: Public form pages generated from schema

Submissions: Store responses in MongoDB, with image upload support

Dashboard: Users can view generated forms and their submissions

## Tech Stack

Frontend: Next.js 15 + TypeScript, React Hook Form, Tailwind CSS

Backend: Express.js + TypeScript, MongoDB (Atlas), JWT auth

AI: Google Gemini API (or Groq/OpenRouter for free testing)

File Uploads: Cloudinary for image storage

## Setup Instructions
1️⃣ Clone repository
git clone https://github.com/SarthakNative/AI-form-generator-application.git 

2️⃣ Backend Setup
```
cd backend
npm install
```
### Environment variables (backend/.env):
```
PORT= (ex. 4000)
MONGODB_URI=your-mongo-uri
JWT_SECRET=your-jwt-secret
FRONTEND_ORIGIN=your-frontend-origin
GEMINI_API_KEY=your-api-key
```

Run backend server:
```bash
npm run dev
```

3️⃣ Frontend Setup

```bash
cd ../frontend
npm install
```

### Environment variables (frontend/.env.local):
```
NEXT_PUBLIC_API_URL=your-backend-api-endpoint
CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset-name
```
Run frontend:
```
npm run dev
```

Visit `${FRONTEND_ORIGIN}/login` to log in (if new user sign up)

Visit `${FRONTEND_ORIGIN}/dashboard` to generate forms

Public forms available at /form/[id]

Example Prompt → Generated Form

Prompt:
```
"I need a signup form with name, email, age, and profile picture."
```
### Frontend Form Rendering:

Each field is rendered based on type (text, email, number, image)

Image fields support file upload via Cloudinary (or mock upload)

Submission stores responses in MongoDB

### Limitations

Gemini integration is currently for free plan. 

File upload flow is basic; multiple images and progress tracking are not implemented.

Form editing after generation is minimal.

No validation beyond required fields on frontend.

No search or filtering for submissions in dashboard.

### Future Improvements

Upgrade Google Gemini API paid version.

Full Cloudinary upload support for multiple images and previews.

Add field validation rules (min/max, regex) in schema & frontend.

Improve dashboard: search, pagination, analytics.

Add role-based access and form sharing links with permissions.

Add dynamic form editing and versioning.

Add skeleton loader for loading states.
