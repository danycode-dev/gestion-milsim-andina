import { useMemo, useState } from "react";
import { useDashboardData } from "../../context/DataContext";
import { useModal } from "../../context/ModalContext";
import { ALERT_TYPES, useAlertGlobal } from "../../context/AlertContext";
import { motion, AnimatePresence } from "motion/react";
export default function UserPermissionsModal({ user }) {
  const { dashboardData, rolesById, updateUser } = useDashboardData();
  const { closeModal } = useModal();
  const { addGlobalAlert } = useAlertGlobal();

  const [roleId, setRoleId] = useState(user.role_id);
  const [saving, setSaving] = useState(false);

  const roles = dashboardData?.roles ?? [];

  const selectedRole = rolesById?.[roleId];

  const permissions = useMemo(() => {
    return selectedRole?.permissions ?? [];
  }, [selectedRole]);

  const hasChange = String(roleId) !== String(user.role_id);

  const submitHandler = async () => {
    if (!hasChange || saving) return;

    setSaving(true);

    try {
      await updateUser(
        { role_id: Number(roleId) },
        user.id
      );

      addGlobalAlert({
        estado: ALERT_TYPES.SUCCESS,
        msg: "Rol del usuario actualizado"
      });


      closeModal(true);

    } catch (e) {
      console.error(e);

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

      <div className="w-[90%] max-w-lg bg-dashboard-card rounded-dashboard border border-dashboard-accent shadow-2xl max-h-[90vh] flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-center relative px-6 py-4 border-b border-dashboard-border">

          <div className="text-center">
            <h2 className="mb-0! p-0 text-xl">
              Roles y permisos
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Administrar permisos de {user.username}
            </p>
          </div>

          <button
            onClick={() => closeModal()}
            className="text-3xl leading-none text-gray-500 hover:text-white transition p-5 absolute right-0"
          >
            ×
          </button>

        </div>


        {/* CONTENIDO */}
        <div className="px-6 py-6 overflow-y-auto">

          <div className="space-y-5">

            {/* USUARIO */}
            <div className="bg-dashboard-item border border-dashboard-border rounded-lg p-4">

              <div className="flex items-center gap-3">

                <div className="shrink-0 w-11 h-11 rounded-full bg-dashboard-button border border-[#555] flex items-center justify-center text-dashboard-accent font-bold">
                  {user.username?.charAt(0)?.toUpperCase() || "?"}
                </div>

                <div className="min-w-0 flex flex-col items-start">
                  <p className="font-semibold text-gray-200">
                    {user.username}
                  </p>

                  <p className="text-xs text-gray-500 break-all">
                    {user.email || "Sin correo registrado"}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    ID: {user.id}
                  </p>
                </div>

              </div>

            </div>


            {/* SELECCIÓN DE ROL */}
            <div>

              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rol del usuario
              </label>

              <select
                value={roleId ?? ""}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full py-2 px-2 bg-dashboard-item rounded-xs"
              >
                <option value="" disabled>
                  Seleccione un rol
                </option>

                {roles.map(role => (
                  <option
                    key={role.id}
                    value={role.id}
                    className="bg-dashboard-item"
                  >
                    {role.name}
                  </option>
                ))}
              </select>

              <p className="text-xs text-gray-500 mt-2">
                Los permisos del usuario se heredan del rol asignado.
              </p>

            </div>


            {/* PERMISOS HEREDADOS */}
            <div className="border border-dashboard-border rounded-lg overflow-hidden">

              <div className="bg-dashboard-item px-4 py-3 flex items-center justify-between">

                <h3 className="text-sm font-semibold text-gray-200">
                  Permisos del rol
                </h3>

                <span className="text-xs text-dashboard-accent">
                  {permissions.length} permisos
                </span>

              </div>

              <div className="p-4">

                {permissions.length === 0 ? (

                  <p className="text-sm text-gray-500 text-center py-4">
                    Este rol no tiene permisos asignados.
                  </p>

                ) : (

                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence mode="popLayout">
                      {permissions.map((permission) => {
                        const permissionName = permission
                      
                      
                        return (
                          <motion.div
                            key={permissionName}
                        
                            // Estado inicial 
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        
                            // Estado final
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                        
                            // Animación cuando se elimina
                            exit={{ opacity: 0, scale: 0.8, y: -10 }}
                        
                            // Anima cambios de posición
                            layout
                        
                            transition={{
                              duration: 0.25,
                              ease: "easeOut",
                            }}
                          
                            className="inline-flex items-center gap-2 bg-dashboard-success/20 border border-dashboard-border rounded-lg px-2 py-0 m-0"
                          >
                            <span className="text-green-400 text-sm shrink-0">
                              ✓
                            </span>
                          
                            <span className="text-sm text-gray-300 whitespace-nowrap">
                              {permissionName}
                            </span>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                )}

              </div>

            </div>


            {/* PERMISOS INDIVIDUALES - FUTURO */}
            <div className="border border-dashboard-border rounded-lg p-4 opacity-60">

              <div className="flex items-center justify-between gap-3">

                <div>
                  <p className="text-sm font-semibold text-gray-300">
                    Permisos individuales
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Asignación de permisos adicionales al usuario.
                  </p>
                </div>

                <span className="text-xs text-gray-500 shrink-0">
                  Próximamente
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-dashboard-border">

          <button
            onClick={() => closeModal()}
            className="btn-secondary"
            disabled={saving}
          >
            Cancelar
          </button>

          <button
            disabled={!hasChange || saving || !selectedRole}
            onClick={submitHandler}
            className={`
              btn-primary
              ${(!hasChange || saving || !selectedRole)
                ? "cursor-not-allowed opacity-35"
                : ""}
            `}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>

        </div>

      </div>

    </div>
  );
}