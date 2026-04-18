import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import ReuploadPage from './ReuploadPage.jsx'
import AlignmentTest from './AlignmentTest.jsx'

const path = window.location.pathname

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {path === '/admin' ? <AdminDashboard />
    : path === '/reupload' ? <ReuploadPage />
    : path === '/alignment-test' ? <AlignmentTest />
    : <App />}
  </React.StrictMode>
)
