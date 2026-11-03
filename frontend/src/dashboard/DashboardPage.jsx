import { useState, useEffect, useRef } from 'react'
import AttendanceTab from './tabs/AttendanceTab';
import { useDashboardData } from '../context/DataContext';
import StatsTab from './tabs/StatsTab';
import MemberTab from './tabs/MembersTab';
import NameTab from './tabs/layautTab';
import UsersTab from './tabs/UsersTab';
import { useUser } from '../context/UserContext';
import { useModal } from '../context/ModalContext';
import { User } from '../entities/user.entity';
import AuditLogsTab from './tabs/AuditLogsTab';
import packageInfo from "../../package.json";


export default function DashboardPage() {


    const [activeTab, setActiveTab] = useState('registro');
    const { dashboardData, setDashboardData, rolesById } = useDashboardData();
    /** @type {{user: User || undefined }} */
    const { user, isLoading, error, AuthLogout } = useUser();
    const { openModal } = useModal();
    

    function TabBtn({name, identify, permissionNeed }){
      const block = permissionNeed ? !user.hasPermission(permissionNeed) : false
      return(
          <button disabled={block} className={`tab-btn disabled:opacity-60 disabled:hover:text-[#888] disabled:cursor-not-allowed ${activeTab === identify ? 'active' : ''}`} onClick={() => setActiveTab(`${identify}`)}>{name}</button>
      )
    }
    const novedadesModalOpen= useRef(false)

    const logicNovedades = async()=>{
      console.log(novedadesModalOpen.current)
      if(novedadesModalOpen.current) return
      console.log('paso if: ', novedadesModalOpen.current)
      novedadesModalOpen.current = true
      const currentVersion = packageInfo.version;
      const lastSeenVersion = localStorage.getItem(
        "milsim_last_seen_version"
      );
    
      const currentRelease = currentVersion.split(".").slice(0, 2).join(".");
      const lastSeenRelease = lastSeenVersion?.split(".").slice(0, 2).join(".");
    
      if (currentRelease === lastSeenRelease) return;
    
      await openModal("whats-new", {
        lastSeenVersion,
        currentVersion
      });
      novedadesModalOpen.current = false
      
    }

    useEffect(() => {
      logicNovedades()
    }, []);

  const viewUserHandler = () => {
    openModal("my-user", {});
  };


    return (
    <>
        <header className="
              relative flex flex-col items-center
              border-b-2 border-dashboard-accent
              pb-5 mb-7 px-4
            ">
              <h1 className="
                text-xl sm:text-3xl
                font-bold tracking-wider
                text-dashboard-accent
              ">
                Gestión MilSim
              </h1>

              <p className="text-gray-400 text-sm mt-1">
                Sistema de Administración de Personal
              </p>

              {/* Logo original */}
            <img
              src="/d1.png"
              alt="Logo MilSim"
              className="
                hidden sm:block
                absolute right-0 top-1/2
                -translate-y-1/2
                h-28 md:h-32
                w-auto object-contain
              "
            />

              {/* Usuario y cierre de sesión */}
              {user && (
                <div className="
                  flex items-center justify-center
                  gap-3 mt-4
                  flex-wrap
                  text-sm
                ">
                  <div className="
                    flex items-center gap-2
                    bg-dashboard-card
                    border border-dashboard-border
                    rounded-lg px-3 py-2
                  ">
                    <span className="text-gray-400">Usuario:</span>
                    <span className="text-dashboard-accent font-semibold">
                      {user.username}
                      {}
                    </span>
                  </div>
                  <div className="
                    flex items-center gap-2
                    bg-dashboard-card
                    border border-dashboard-border
                    rounded-lg px-3 py-2
                  ">
                    <span className="text-gray-400">Rol:</span>
                    <span className="text-dashboard-text font-semibold">
                      {rolesById[user.role_id] ? rolesById[user.role_id].name :user.role_id}
                      {}
                    </span>
                    
                  </div>
                  {/*Correo (no lo muestro pórque solo quita espacio inecesariamente)*/}
                  {/*<div className="
                    flex items-center gap-2
                    bg-dashboard-card
                    border border-dashboard-border
                    rounded-lg px-3 py-2
                  ">
                    <span className="text-gray-400">Correo:</span>
                    <span className="text-gray-350 ">
                      {user.email || "Sin correo registrado"}
                      {}
                    </span>
                    
                  </div>*/}
            
                  <button
                    type="button"
                    onClick={viewUserHandler}
                    className="
                      bg-dashboard-accent
                      border border-black
                      text-black
                      font-semibold
                      hover:bg-dashboard-danger
                      hover:text-white
                      rounded-lg px-3 py-2
                      transition-colors cursor-pointer
                    "
                  >
                    Mi Cuenta
                  </button>
                  <button
                    type="button"
                    onClick={AuthLogout}
                    className="
                      bg-dashboard-button
                      border border-dashboard-border
                      text-dashboard-text
                      hover:bg-dashboard-danger
                      hover:text-white
                      rounded-lg px-3 py-2
                      transition-colors cursor-pointer
                    "
                  >
                    Cerrar sesión
                  </button>
                  
                </div>
              )}
        
        </header>
        
        <div className="tabs overflow-x-auto">
            <TabBtn identify="registro" name="Registro Diario" permissionNeed='attendance.view'/>
            <TabBtn identify="estadisticas" name="Estadísticas" permissionNeed='attendance.view'/>
            {/* <TabBtn identify="meses" name="Meses" /> */}
            <TabBtn identify="miembros" name="Gestionar Miembros" permissionNeed='members.view'/>
            <TabBtn identify="users" name="Usuarios y Roles" permissionNeed='users.view'/>
            <TabBtn identify="audit_logs" name="Logs" permissionNeed={'audit_logs.view'} />
            <TabBtn identify="prox" name="Unidades y Parches" />
        </div>


        {activeTab === 'registro' && <AttendanceTab />}
        {activeTab === 'estadisticas' && <StatsTab />}
        {activeTab === 'miembros' && <MemberTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'audit_logs' && <AuditLogsTab />}
        {activeTab === 'prox' && <NameTab />}
    </>
    );
} 