import { createContext, useContext, useState, useEffect } from "react";
import { config } from "../config/env";
import { User } from "../entities/user.entity";



// Crear el contexto
const UserContext = createContext();

// Provider
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);


  const reloadUser = async () => {
    await fetchData();
  }

const changePassword = async (values) => {
  const res = await fetch(`${config.apiUrl}/users/me/password`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    }),
  });

  const result = await res.json().catch(() => ({}));

  if (!res.ok || result.ok === false) {
    throw new Error(
      result.error || "No se pudo cambiar la contraseña"
    );
  }

  return true;
};


  const AuthLogin = async (username, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${config.apiUrl}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        if (res.status === 401) {
          throw new Error("Usuario o contraseña incorrectos");
        }
        throw new Error(
          (error.error  || error.message || `Error `)+`  Code: ${res.status}: ${res.statusText}`
        );
      }

      const data = await res.json();
      if (data?.ok === false) {
        
        throw new Error(data.error || data.message || "Error con la petición");
      }
      console.log("Login successful:", data);
      const user = new User(data.user);
      setUser(user);
      return true;

    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
    finally {
      setIsLoading(false);
    }
  }

  const fetchUser = async () => {
    try {
        const res = await fetch(`${config.apiUrl}/auth/me`,{
          credentials: "include",
        })
      
      if (res.code === 401) {
        setUser(null);
        return;
      } 
      if (res.status === 401) {
        setUser(null);
        return;
      }

      if (!res.ok) {
        setUser(null);
        setError("Error fetching user data");
        return;
      }
  
      const nUser = await res.json();
      
      const user = new User(nUser);
      console.log("seccion iniciada como:",user );
      setUser(user);


    
    } catch (err) {
      console.error(err);
    }finally {
      setIsLoading(false);
    }
  };

  const AuthLogout = async ()=>{
    try{
      
      const res = await fetch(`${config.apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.message || "Error during logout");
        return false;
      }

      const data = await res.json();
      console.log("Logout successful:", data);
      setUser(null);

    }catch{
        console.error(err);
    }
  }
  const value = {
    user,
    isLoading,
    error,
    reloadUser,
    AuthLogin,
    AuthLogout,
    changePassword
  }


  
  useEffect(() => {
 
		  console.log("vacio");
      fetchUser();
		}, []);



  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Hook 
export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser debe usarse dentro de UserProvider");
  }

  return context;
}




