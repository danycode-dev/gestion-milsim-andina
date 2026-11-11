import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { ModalProvider } from './context/ModalContext.jsx'
import { AlertProvider } from './context/AlertContext.jsx'
import { BrowserRouter } from "react-router";
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AlertProvider>   
        <UserProvider> 
          <App />
        </UserProvider>
      </AlertProvider> 
    </BrowserRouter>   
  </StrictMode>,
)
