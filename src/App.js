import React, { useState, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthService, ChatService, SocketService } from './services'
import ChatApp from './components/ChatApp/ChatApp'
import UserLogin from './components/UserLogin/UserLogin'
import UserCreate from './components/UserCreate/UserCreate'
import './App.css'

const authService = new AuthService()
const chatService = new ChatService(authService.getBearerHeader)
const socketService = new SocketService(chatService)

export const UserContext = createContext()

const AuthProvider = ({ children }) => {
  const context = {
    authService,
    chatService,
    socketService,
    appSelectedChannel: {},
    appSetChannel: (ch) => {
      setAuthContext({ ...authContext, appSelectedChannel: ch })
      chatService.setSelectedChannel(ch)
    }
  }

  const [authContext, setAuthContext] = useState(context)

  return <UserContext.Provider value={authContext}>{children}</UserContext.Provider>
}

function PrivateRoute({ children, ...props }) {
  const context = useContext(UserContext)
  const { isLoggedIn } = context.authService

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: { ...props } }} replace />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<UserLogin />} />
        <Route path="/create" element={<UserCreate />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <ChatApp />
            </PrivateRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
