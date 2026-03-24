import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminDashboard from './AdminDashboard.jsx'

const isAdmin = window.location.pathname === '/admin'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <AdminDashboard /> : <App />}
  </React.StrictMode>
)
