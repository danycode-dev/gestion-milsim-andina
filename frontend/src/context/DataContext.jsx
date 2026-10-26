import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { config } from "../config/env";
import { User } from "../entities/user.entity";
import { ALERT_TYPES, useAlertGlobal } from "./AlertContext";



const DataContext = createContext();

// Provider
export function DataProvider({ children }) {
  //  data  es dasboardata,  son los datos base que necesita cualquier usario para mostrar la info basica 
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const {addGlobalAlert} = useAlertGlobal(); 
  
  //  users 
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // audit Logs
  const [auditLogs, setAuditLogs] = useState([]);

  // ====== use Memo
  const membersById = useMemo(() => {
      return Object.fromEntries(
          data?.members.map(member => [
              member.id,
              member
          ]) ?? []
      );
  }, [data?.members]);

  const ranksById = useMemo(() => {
      return Object.fromEntries(
          data?.ranks.map(rank => [
              rank.id,
              rank
          ]) ?? []
      );
  }, [data?.ranks]);
  const unitsById = useMemo(() => {
      return Object.fromEntries(
          data?.units.map(unit => [
              unit.id,
              unit
          ]) ?? []
      );
  }, [data?.units]);
    const rolesById = useMemo(() => {
      return Object.fromEntries(
          data?.roles.map(rol => [
              rol.id,
              rol
          ]) ?? []
      );
  }, [data?.roles]);
  // FIN 

  const fetchAuditLogs = async () => {
    const response = await fetch(`${config.apiUrl}/audit_logs`, {
      credentials: "include",
    });

    if (!response.ok) {
      const result = await res.json().catch(() => ({}));
      throw new Error(result.error || "Error al obtener los logs");
    }
    const result = await response.json();

    if (!result.ok) {
      throw new Error(
        result.error || "Error al obtener los logs"
      );
    }

    setAuditLogs(result.data ?? []);

    return result.data;
  };

  const fetchUsers = async () => {
    console.log('comenzando feth')
    setUsersLoading(true);
  
    try {
      const res = await fetch(`${config.apiUrl}/users`, {
        credentials: "include"
      });
    
      if (!res.ok) {
        throw new Error("Error al obtener usuarios");
      }
    
      const result = await res.json();
      console.log('users:', result.users)
      const usersArray = result.users.map(u => new User(u))
      console.log('userArray: ', usersArray)
      setUsers(usersArray);
    
    } catch (error) {
      console.error(error);
    } finally {
      setUsersLoading(false);
    }
  };
  const newUser = async (userData) => {
  const res = await fetch(`${config.apiUrl}/users`, {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  });

  if (!res.ok) {
    const result = await res.json().catch(() => ({}));
    throw new Error(result.error || "Error al crear usuario");
  }

  const result = await res.json();

  await fetchUsers();

  return result;
  };
	const loadAttendancebyId = async (eventId) => {
    console.log('loadAtendancebyID: ', eventId)
    try {
      const res = await fetch(`${config.apiUrl}/events/${eventId}/attendance`)
      if (!res.ok) {
        throw new Error("Error fetching attendance data");
      }
      const body = await res.json();
      const newData = formatAttendanceInData(data, body.data, eventId);
      setData(newData);
      return newData.attendances[eventId];
      
    } catch (err) {
      console.error("Error loading attendance:", err);
      throw err;
    }
  };

  const saveNewEventAndAttendace = async (eventData) => {
    console.log("Saving new event and attendance:", eventData);
    try {
      const res = await fetch(`${config.apiUrl}/events`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(eventData)

      });

      if (!res.ok) {
        throw new Error("Error en la petición", await res.text());
      }
      
      const result = await res.json();
      await reloadData();
      return result.data.eventId; 

    }catch (err) {
      console.error("Error saving attendance:", err);
    }

  }

const updateEventAndAttendace = async (changes, eventId) => {
  console.log("Updating event and attendance:", changes, eventId);
  try {
    const res = await fetch(`${config.apiUrl}/events/${eventId}`, {
      credentials: "include",
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(changes)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al actualizar el evento");
    }

    await reloadData();

    return true;

  } catch (error) {
    console.error("Error al actualizar evento:", error.message);
    return false;
  }
};

  const updateMember = async (changes, memberId)=>{
    try {
      const res = await fetch(`${config.apiUrl}/members/${memberId}`, {
        credentials: "include",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(changes)
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(
          error.error || error.message || `Error ${res.status}: ${res.statusText}`
        );
      }
      const data = await res.json();
      if (data?.ok === false) {
        throw new Error(data.message || "Error con la petición");
      }  
      await reloadData()
      return 
    }catch(e){
      console.error(e)
      throw e
    }
  }
  const deleteMember = async (memberId) => {
  try {
    const res = await fetch(`${config.apiUrl}/members/${memberId}`, {
      credentials: "include",
      method: "DELETE"
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(
        error.error || error.message || `Error ${res.status}: ${res.statusText}`
      );
    }

    const data = await res.json();

    if (data?.ok === false) {
      throw new Error(data.message || "Error al eliminar el miembro");
    }

    await reloadData();
    return data;

  } catch (e) {
    console.error(e);
    throw e;
  }
};
  const newMember = async (member={nickname, rank_id, unit_id})=>{
    try {
      const res = await fetch(`${config.apiUrl}/members`, {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(member)
      });
      if (!res.ok){
          const error = await res.json().catch(() => ({}));

          throw new Error(
            error.error || error.message || `Error ${res.status}: ${res.statusText}`
          );
      }
      const data = await res.json()
      if(data?.ok===false){
        throw new Error(`${data.error|| data.message || 'Error con la peticion'} `)
      }  
      await reloadData()
      return true

    }catch(e){
      console.error(e)
      throw e
    }
  }

  const reloadData = async ({reloadAttendancesforids=[]}={reloadAttendancesforids:[]}) => {
    await fetchData({loadAttendancesforids:reloadAttendancesforids});
  }
  const fetchData = async ({loadAttendancesforids=[]}={loadAttendancesforids:[]}) => {
    console.log("ReloadData");
    try {
        const res = await fetch(`${config.apiUrl}/app/bootstrap`);
    
      if (!res.ok) {
        throw new Error("Error en la petición");
      }
  
      let data = await res.json();
      console.log("data recibida:", data);
      
      if (loadAttendancesforids.length > 0) {
        for (const eventId of loadAttendancesforids) {
          try {
            console.log(`Loading attendance for event ${eventId} in fetchData...`);
            const attendanceRes = await fetch(`${config.apiUrl}/events/${eventId}/attendance`);
            if (!attendanceRes.ok) {
              throw new Error(`Error fetching attendance for event ${eventId}`);
            }
            const attendanceData = await attendanceRes.json();

            data = formatAttendanceInData(data, attendanceData.data, eventId);
          } catch (err) {
            console.error(`Error loading attendance for event ${eventId}:`, err);
          }
        }
      }
      // setState aquí
      // setAppData(data);
      const formattedData = formatData(data);
    setData(formattedData);
    
    } catch (err) {
      console.error(err);
    }
  };

  const value = {
    membersById,
    ranksById,
    unitsById,
    rolesById,
    dashboardData: data,
    setDashboardData: setData,
    isLoading,
    setIsLoading,
    error,
    setError,
    loadAttendancebyId,
    saveNewEventAndAttendace,
    reloadData,
    updateEventAndAttendace,
    updateMember,
    newMember,
    newUser,
    deleteMember,
    fetchUsers,
    users,
    usersLoading,
    auditLogs,
    fetchAuditLogs
  };

  
  useEffect(() => {
 
		  fetchData();
		}, []);

  useEffect(()=>{console.log('DasboardData: ',data)},  [data])



  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// Hook 
export function useDashboardData() {
  const context = useContext(DataContext);

  if (!context) {
    throw new Error("useDashboardData debe usarse dentro de DataContextProvider");
  }

  return context;
}



const formatData= (newData) => {
    const data = {
        ranks: newData.ranks ? newData.ranks : [],  // ['Oficiales', 'Cadetes', 'Aspirantes', 'Reclutas']
        members: newData.members ? newData.members : [], // [{ name: 'Pegaso', rank: 'Oficiales' }, ...]
        membersByRank: newData.membersForRank ? newData.membersForRank : {}, // { 'Oficiales': [{name: 'Pegaso', ...}], 'Cadetes': [...], ... }
        attendances: newData.attendances ? newData.attendances : {}, // idEvento: { member_id: { estado: 'P', comentario: '...' }, ... }
        events: newData.events ? newData.events : [], // [{ id: 'idEvento', date: "2025-01-01T03:00:00.000Z", name: 'Evento 1' }, ...]
        units: newData.units ? newData.units : [],
        event_types: newData.event_types ? newData.event_types : [],
        permissions:newData.permissions ? newData.permissions : [],
        roles:newData.roles ? newData.roles : []
    };
	return data;
}

function formatAttendanceInData(data, newAttendance, eventId) {
  return {
    ...data,
    attendances: {
      ...data.attendances,
      [eventId]: newAttendance
    }
  };
}