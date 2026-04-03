import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import ReuploadPage from './ReuploadPage.jsx'

const path = window.location.pathname

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {path === '/admin' ? <AdminDashboard /> : path === '/reupload' ? <ReuploadPage /> : <App />}
  </React.StrictMode>
)
