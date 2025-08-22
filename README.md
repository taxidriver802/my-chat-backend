# 💬 MyChat

**MyChat** is a real-time messaging web application built with React, Node.js, and Socket.IO. It supports one-on-one and group chats, image sharing, typing indicators, unread message tracking, and more — all in a clean, responsive UI.

> 🚧 This is a full-stack chat app project built as part of my portfolio to demonstrate real-time features, full CRUD API integration, and modular UI state management.

---

## ✨ Features

- 🔒 **Authentication** (signup/login/logout)
- 💬 **Real-Time Messaging** via WebSockets
- 👥 **One-on-One & Group Chats**
- 👀 **Typing Indicators**
- 🔔 **Unread Message Badges**
- 🖼️ **Image Uploads** with viewer modal
- 😄 **Emoji Picker & Reactions**
- 📦 **State Management** with Zustand
- 📷 **Cloudinary Image Hosting**
- 🌐 **Fully Responsive UI**

---

## 🚀 Technologies Used

### Frontend

- React 19 + Vite
- React Router
- Tailwind CSS
- Zustand (state management)
- Socket.IO Client
- Axios
- Cloudinary (image hosting)

### Backend

- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- JWT Authentication
- bcrypt (password hashing)
- Multer + Cloudinary (file handling)
- CORS

---

## 🛠️ Getting Started

### 📁 Prerequisites (WIP live page)

- Node.js and npm installed
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)
- `.env` files for both frontend and backend

### 🔗 Related Repositories

- 💻 Frontend: [my-chat-frontend](https://github.com/taxidriver802/my-chat-frontend)
- 📦 Backend: [my-chat-backend](https://github.com/taxidriver802/my-chat-backend)

### 🔧 Clone the Project

```bash
git clone https://github.com/taxidriver802/my-chat-frontend.git
git clone https://github.com/taxidriver802/my-chat-backend.git
```

### 🔌 Setup Backend

```bash
cd my-chat-backend
npm install
touch .env
# Add MongoDB URI, JWT_SECRET, Cloudinary keys
npm run dev
```

### 🌐 Setup Frontend

```bash
cd ../my-chat-frontend
npm install
touch .env
# Add VITE_API_URL pointing to backend (e.g., http://localhost:5001)
npm run dev
```

Then visit: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Optional: Seed Users

Add a script or use Postman to create sample users for testing.

---

## 📦 Folder Structure Overview

```bash
/my-chat
├── backend (my-chat-backend)
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── server.js
├── frontend (my-chat-frontend)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── main.jsx
```

---

## 🤝 Credits

Built by [Jason Cox](https://github.com/taxidriver802) as a full-stack portfolio project.

---

## 📄 License

MIT License
