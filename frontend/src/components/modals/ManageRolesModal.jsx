
import { useState } from "react";
import { useModal } from "../../context/ModalContext";
import { ALERT_TYPES, useAlertGlobal } from "../../context/AlertContext";
import { useDashboardData } from "../../context/DataContext";
import { User } from "../../entities/user.entity";
import { useUser } from "../../context/UserContext";

export default function ManageRolesModal({}) {
  /** @type {{ user: User | undefined }} */
  const { user:selfUser } = useUser();
  const { dashboardData, rolesById, updateRole, newRole, deleteRole } = useDashboardData(); 
	const roles = dashboardData.roles
	 const permissions = dashboardData.permissions



  const { closeModal } = useModal();
  const { addGlobalAlert } = useAlertGlobal();
  const {openModal} = useModal();

  const [selectedId, setSelectedId] = useState(roles[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedRole = roles.find(
    role => role.id === selectedId
  );



  const getChanges = () => {
  if (!selectedRole) return {};

  const changes = {};

  if (values.name.trim() !== selectedRole.name) {
    changes.name = values.name.trim();
  }

  const oldPermissions = selectedRole.permissions ?? [];
  const newPermissions = values.permissions;

  const samePermissions =
    oldPermissions.length === newPermissions.length &&
    oldPermissions.every(p => newPermissions.includes(p));

  if (!samePermissions) {
    changes.permissions = newPermissions;
  }

  return changes;
};

  // Estado editable
  const [values, setValues] = useState({
    name: selectedRole?.name ?? "",
    permissions: selectedRole?.permissions ?? []
  });

  // Seleccionar otro rol
  const selectRole = (role) => {
    setSelectedId(role.id);
    setCreating(false);

    setValues({
      name: role.name,
      permissions: [...(role.permissions ?? [])]
    });
  };

  // Crear rol
  const newRoleHandler = () => {
    setSelectedId(null);
    setCreating(true);

    setValues({
      name: "",
      permissions: []
    });
  };

  // Activar/desactivar permisos
  const togglePermission = (permissionName) => {
    setValues(prev => {
      const exists = prev.permissions.includes(permissionName);

      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter(p => p !== permissionName)
          : [...prev.permissions, permissionName]
      };
    });
  };

  const hasChanges =
    creating ||
    (selectedRole && (
      values.name !== selectedRole.name ||
      JSON.stringify([...values.permissions].sort()) !==
      JSON.stringify([...(selectedRole.permissions ?? [])].sort())
    ));

  // Guardar
  const submitHandler = async () => {
    if (!values.name.trim() || !hasChanges || saving) return;

    setSaving(true);

    try {

      if (creating) {
        await newRole(values);
      }else {
        if(selfUser?.role_id === selectedRole.id){
          addGlobalAlert({
            estado: ALERT_TYPES.ERROR,
            msg: "No puedes editar tu propio rol."
          });
          return;
        }
        const changes = getChanges();
        
        if (!Object.keys(changes).length > 0) throw new Error("No hay cambios para guardar.");
        await updateRole(changes, selectedRole.id );
      }
        

      addGlobalAlert({
        estado: ALERT_TYPES.SUCCESS,
        msg: creating ? "Rol creado" : "Rol actualizado"
      });

      closeModal();

    } catch (e) {
      addGlobalAlert({
        estado: ALERT_TYPES.ERROR,
        msg: e.message
      });

    } finally {
      setSaving(false);
    }
  };

  // Eliminar
  const deleteHandler = async () => {
    if (!selectedRole || saving) return;

    if(selfUser?.role_id === selectedRole.id){
      addGlobalAlert({
        estado: ALERT_TYPES.ERROR,
        msg: "No puedes eliminar tu propio rol."
      });
      return;
    }
    const confirmed = await openModal("confirm", {
      title: "Eliminar Rol",
      message: `¿Estás seguro de que quieres ELIMINAR el rol: ${selectedRole.name}?`,
      confirmText: "Eliminar",
      danger: true
    });
    setSaving(true);

    try {
      await deleteRole(selectedRole.id);

      addGlobalAlert({
        estado: ALERT_TYPES.SUCCESS,
        msg: "Rol eliminado"
      });

      closeModal();

    } catch (e) {
      addGlobalAlert({
        estado: ALERT_TYPES.ERROR,
        msg: e.message
      });

    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm">

      <div className="w-[95%] max-w-4xl max-h-[90vh] flex flex-col bg-dashboard-card rounded-dashboard border border-dashboard-accent shadow-2xl">

        {/* HEADER */}
        <div className="relative px-6 py-4 border-b border-dashboard-border">

          <h2 className="mb-0! text-xl">
            Administrar roles
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Crea roles y configura sus permisos.
          </p>

          <button
            onClick={() => closeModal()}
            className="absolute right-4 top-3 text-3xl text-gray-500 hover:text-white"
          >
            ×
          </button>

        </div>

        {/* CONTENIDO */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] min-h-0 flex-1 overflow-y-auto md:overflow-hidden">

          {/* LISTADO DE ROLES */}
          <div className="border-b md:border-b-0 md:border-r border-dashboard-border p-4 md:overflow-y-auto">

            <p className="text-xs text-gray-500 mb-3">
              Roles existentes
            </p>

            <div className="space-y-2">

              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => selectRole(role)}
                  className={`
                    w-full text-left px-3 py-3 rounded-lg border transition
                    ${selectedId === role.id && !creating
                      ? "bg-dashboard-button border-dashboard-accent"
                      : "bg-dashboard-item border-dashboard-border hover:border-dashboard-accent"
                    }
                  `}
                >
                  <p className="text-sm font-medium text-gray-200">
                    {role.name}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    {role.permissions?.length ?? 0} permisos
                  </p>

                </button>
              ))}

              <button
                onClick={newRoleHandler}
                className="btn-secondary w-full text-sm mt-3"
              >
                + Nuevo rol
              </button>

            </div>

          </div>

          {/* EDITOR */}
          <div className="p-5 md:p-6 md:overflow-y-auto min-w-0">

            {(selectedRole || creating) ? (

              <div className="space-y-6">

                {/* NOMBRE */}
                <div>

                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre del rol
                  </label>

                  <input
                    type="text"
                    value={values.name}
                    placeholder="Nombre del rol..."
                    onChange={e => setValues(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    className="w-full"
                  />

                </div>

                {/* PERMISOS */}
                <div>

                  <div className="flex items-center justify-between mb-3">

                    <h3 className="text-sm font-semibold text-gray-300">
                      Permisos del rol
                    </h3>

                    <span className="text-xs text-dashboard-accent">
                      {values.permissions.length} seleccionados
                    </span>

                  </div>

                  <div className="flex flex-wrap gap-2">

                    {permissions.map(permission => {

                      const permissionName =
                        typeof permission === "string"
                          ? permission
                          : permission.name;

                      const checked = values.permissions.includes(permissionName);

                      return (
                        <label
                          key={permissionName}
                          className={`flex items-center gap-1 justify-center  m-0
                            border border-dashboard-border rounded-lg px-2 py-1 cursor-pointer hover:border-dashboard-accent transition
                            ${checked?'bg-dashboard-success/20':''}
                          `}
                        >

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(permissionName)}
                            className="accent-dashboard-accent hidden"
                          />
                          <span className={` text-sm shrink-0
                            ${checked?'text-green-400':'text-red-400'}`}>
                              {checked?'✓':'✕'}
                            </span>
                          <span className="text-sm text-gray-300 break-all">
                            {permissionName}
                          </span>

                        </label>
                      );
                    })}

                    {permissions.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-6">
                        No hay permisos disponibles.
                      </p>
                    )}

                  </div>

                </div>

              </div>

            ) : (

              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                Selecciona un rol para editarlo.
              </div>

            )}

          </div>

        </div>

        {/* FOOTER */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-dashboard-border">

          <div>
            {!creating && selectedRole && (
              <button
                onClick={deleteHandler}
                disabled={saving}
                className="text-sm text-red-400 hover:text-red-300 disabled:opacity-40"
              >
                Eliminar rol
              </button>
            )}
          </div>

          <div className="flex gap-3">

            <button
              onClick={() => closeModal()}
              className="btn-secondary"
              disabled={saving}
            >
              Cancelar
            </button>

            <button
              onClick={submitHandler}
              disabled={!hasChanges || !values.name.trim() || saving}
              className={`btn-primary ${
                !hasChanges || !values.name.trim() || saving
                  ? "opacity-35 cursor-not-allowed"
                  : ""
              }`}
            >
              {saving
                ? "Guardando..."
                : creating
                  ? "Crear rol"
                  : "Guardar cambios"}
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}
