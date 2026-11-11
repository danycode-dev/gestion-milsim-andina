import { useState } from 'react'

import './App.css'
import DashboardPage from './dashboard/DashboardPage';
import { DataProvider } from './context/DataContext';
import { useUser } from './context/UserContext';
import AuthForm from './auth/AuthForm';
import { ModalProvider } from './context/ModalContext';
import ModalRenderer from './components/modals/ModalRenderer';
import { CircularProgress } from '@mui/material';
import { Routes, Route, Navigate } from "react-router";


// NOTA: MIGRANDO DESDE CODIGO LEGACY A REACT

function App() {
    const {user, isLoading, error } = useUser();

  




  return (
    <>  
    <Routes>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard/*" element={
        <>
        	{isLoading ? 
        	    <div className={`
        	    absolute p-2
        	    bg-dashboard-button/5
        	    top-0 left-0
        	    flex justify-center items-center
        	    rounded-lg
        	    `}>
        	        <CircularProgress size={70} thickness={6}  className=''/>
        	    </div>
        	    : error ? <div className='error'>Error: {error.message}</div>:''}
        	    {false ? null :
        	    <div className="container md:p-2">
        	        {
        	            !user ? <AuthForm />:<DataProvider><ModalProvider> <ModalRenderer></ModalRenderer> <DashboardPage /></ModalProvider> </DataProvider>
        	        }
        	    </div>
        	}     
        </>
      }>

      </Route>
    </Routes>


    </>
  )
}

export default App
