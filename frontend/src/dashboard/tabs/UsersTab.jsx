
import { useEffect, useMemo, useState } from "react";
import { useDashboardData } from "../../context/DataContext";
import { useModal } from "../../context/ModalContext";

export default function UsersTab() {
  const { users, fetchUsers, rolesById } = useDashboardData();
  const { openModal } = useModal();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        await fetchUsers();
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // Estadísticas
  const stats = useMemo(() => {
    const list = users ?? [];

    return {
      total: list.length,
      active: list.filter(u => u.active).length,
      inactive: list.filter(u => !u.active).length,
    };
  }, [users]);

  // Filtros de búsqueda
  const filteredUsers = useMemo(() => {
    return (users ?? []).filter(user => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        (user.username ?? "").toLowerCase().includes(query) ||
        (user.email ?? "").toLowerCase().includes(query) ||
        String(user.id).includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.active) ||
        (statusFilter === "inactive" && !user.active);

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  // Acciones: modales aun no implementadas
  const newUserHandler = () => {
    openModal("new-user", {});
  };

  const editUserHandler = (user) => {
    openModal("edit-user", { user });
  };

  const viewUserHandler = (user) => {
    openModal("view-user", { user });
  };

  const permissionsHandler = (user) => {
    openModal("user-permissions", { user });
  };

  const toggleUserHandler = (user) => {
    openModal("toggle-user-status", { user });
  };


  return (
    <div id="usuarios" className="tab-content active">
      <div className="section-card">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="mb-1">Gestión de Usuarios</h2>
            <p className="text-sm text-gray-500">
              Administra las cuentas, roles y permisos de acceso al sistema.
            </p>
          </div>

          <button
            className="btn-primary"
            onClick={newUserHandler}
          >
            + Nuevo usuario
          </button>
        </div>

        {/* ESTADÍSTICAS */}
        {/*<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: "Total usuarios", value: stats.total },
            { label: "Activos", value: stats.active },
            { label: "Inactivos", value: stats.inactive },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-dashboard-item border border-dashboard-border rounded-lg p-4"
            >
              <p className="text-sm text-gray-400 mb-2">
                {stat.label}
              </p>
              <div className="text-2xl font-bold text-dashboard-accent">
                {stat.value}
              </div>
            </div>
          ))}
        </div>*/}

        {/* BUSCADOR Y FILTROS */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre, correo o ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-0"
          />

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-dashboard-item border border-dashboard-border rounded-lg px-3 py-2 text-gray-200"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          <button
            className="btn-secondary"
            onClick={() => fetchUsers()}
            disabled={loading}
          >
            Actualizar
          </button>
        </div>

        {/* ESTADOS DE CARGA */}
        {loading && (!users || users.length === 0) && (
          <p className="text-center text-gray-400 py-8">
            Cargando usuarios...
          </p>
        )}

        {error && (
          <p className="text-dashboard-danger text-center py-4">
            {error}
          </p>
        )}

        {/* LISTADO */}
        {(!loading || users?.length > 0) && !error && (
          <div className="space-y-3">
            {filteredUsers.map(user => (
              <UserRow key={`userRow${user.id}`} user={user} rolesById={rolesById} />
            ))}

            {/* LISTA VACÍA */}
            {filteredUsers.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">👥</div>

                <p className="text-lg">
                  No se encontraron usuarios
                </p>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function UserRow({
  user,
  rolesById

}){
  const { openModal } = useModal();

      // Acciones: modales aun no implementadas
    const newUserHandler = () => {
      openModal("new-user", {});
    };

    const editUserHandler = (user) => {
      openModal("edit-user", { user });
    };

    const viewUserHandler = (user) => {
      openModal("view-user", { user });
    };

    const permissionsHandler = (user) => {
      openModal("user-permissions", { user });
    };

    const toggleUserHandler = (user) => {
      openModal("toggle-user-status", { user });
    };
    return(

        <div
          key={`divsdahjk${user.id}`}
          className="bg-[#303030] hover:bg-[#383838] border border-dashboard-border rounded-lg p-4 transition"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* IDENTIDAD */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 w-11 h-11 rounded-full bg-dashboard-button border border-[#555] flex items-center justify-center text-dashboard-accent font-bold">
                {user.username?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-semibold text-gray-200">
                    {user.username}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${
                      user.active
                        ? "bg-green-900/30 text-green-400 border-green-800"
                        : "bg-red-900/30 text-red-400 border-red-800"
                    }`}
                  >
                    {user.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 break-all">
                  {user.email || "Sin correo registrado"}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                  <span>ID: {user.id}</span>
                  <span>
                    Rol: {rolesById[user.role_id] ? rolesById[user.role_id].name :user.role_id}
                  </span>
                </div>
              </div>
            </div>
            {/* ACCIONES */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                className="btn-secondary text-xs"
                onClick={() => viewUserHandler(user)}
              >
                Ver
              </button>
              <button
                className="btn-secondary text-xs"
                onClick={() => editUserHandler(user)}
              >
                Editar
              </button>
              <button
                className="btn-secondary text-xs"
                onClick={() => permissionsHandler(user)}
              >
                Permisos
              </button>
              <button
                className="px-3 py-2 text-xs rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-900 transition"
                onClick={() => toggleUserHandler(user)}
              >
                {user.active ? "Desactivar" : "Activar"}
              </button>
            </div>
          </div>
          {/* PERMISOS Y UNIDADES */}
          <div className="mt-4 pt-3 border-t border-dashboard-border flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs text-gray-500">
                Permisos:
              </span>
              <span className="text-xs text-dashboard-accent">
                {user.permissions?.length ?? 0} asignados
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs text-gray-500">
                Unidades:
              </span>
              <span className="text-xs text-gray-300">
                {user.all_units
                  ? "Todas las unidades"
                  : `${user.units?.length ?? 0} asignadas`}
              </span>
            </div>
          </div>
        </div>

    )
}
