
# Event Management Dashboard – Unlocking Possibilities

A full-stack event management application with real-time updates, role-based access control, and comprehensive event registration features.

## 🚀 Tech Stack

### Frontend
- React (Functional Components & Hooks)
- React Router
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Socket.IO

### Architecture
- MVC Pattern
- RESTful APIs
- Real-time WebSocket Communication

---

## 📋 Features

### 🔐 Authentication & Authorization
- User registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes with middleware
- Role-based access (Organizer/User)

### 👥 User Roles

#### Organizer Features
- Create, update, and delete events
- View all created events
- Real-time registration count tracking
- Set event details:
  - Title & Description
  - Date & Time
  - Location
  - Registration deadline
  - Maximum participants

#### User Features
- Browse all available events
- Filter events by date/location
- View event details
- Register for events
- Prevent duplicate registrations
- Registration confirmation

### 📊 Real-Time Updates
- Live registration count updates via Socket.IO
- Instant UI updates across all connected clients

### 🔔 Notification System (Bonus)
- Upcoming event reminders
- Registration deadline alerts
- In-app notifications
- Email notification structure (mock)

---

## 📁 Project Structure

### Backend Structure
```
/server
 ├── controllers
 │    ├── auth.controller.js
 │    ├── event.controller.js
 │    ├── registration.controller.js
 ├── models
 │    ├── User.model.js
 │    ├── Event.model.js
 │    ├── Registration.model.js
 ├── routes
 │    ├── auth.routes.js
 │    ├── event.routes.js
 │    ├── registration.routes.js
 ├── middleware
 │    ├── auth.middleware.js
 │    ├── role.middleware.js
 ├── services
 │    ├── notification.service.js
 │    ├── socket.service.js
 ├── config
 │    ├── db.js
 │    ├── socket.js
 ├── app.js
 ├── server.js
```

### Frontend Structure
```
/client
 ├── src
 │    ├── components
 │    ├── pages
 │    │    ├── Login.jsx
 │    │    ├── Register.jsx
 │    │    ├── OrganizerDashboard.jsx
 │    │    ├── UserDashboard.jsx
 │    │    ├── EventDetails.jsx
 │    ├── context
 │    │    ├── AuthContext.jsx
 │    ├── services
 │    │    ├── api.js
 │    │    ├── socket.js
 │    ├── App.jsx
 │    ├── main.jsx
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB
- npm or yarn

### Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=your-mongodb-connection-string
PORT=3000
NODE_ENV=development
JWT_SECRET=your-jwt-secret
```

### Installation Steps

1. Clone the repository
```bash
git clone <repository-url>
cd event-management-dashboard
```

2. Install dependencies
```bash
npm install
```

3. Set up database
```bash
npm run db:push
```

4. Run development server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `POST /api/events` - Create event (Organizer only)
- `PUT /api/events/:id` - Update event (Organizer only)
- `DELETE /api/events/:id` - Delete event (Organizer only)

### Registrations
- `POST /api/registrations` - Register for event
- `GET /api/registrations/user/:userId` - Get user registrations
- `GET /api/registrations/event/:eventId` - Get event registrations

---

## 🎨 UI Features

- Responsive design (Desktop & Mobile)
- Separate dashboards for Organizers and Users
- Event cards with live registration counters
- Protected routes based on authentication
- Clean, modern interface

---

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Protected API routes
- Role-based authorization
- Input validation
- Centralized error handling

---

## 📦 Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run db:push      # Push database schema
```

---
