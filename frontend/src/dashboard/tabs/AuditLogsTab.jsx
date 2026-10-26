import { useEffect, useMemo, useState } from "react";
import { useDashboardData } from "../../context/DataContext";

export default function AuditLogsTab() {
  const { auditLogs, fetchAuditLogs } = useDashboardData();

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      await fetchAuditLogs();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (auditLogs ?? []).filter(log => {
      const matchesSearch =
        (log.actor?.username ?? "").toLowerCase().includes(query) ||
        (log.entity_name ?? "").toLowerCase().includes(query) ||
        (log.action ?? "").toLowerCase().includes(query) ||
        String(log.entity_id ?? "").includes(query);

      const matchesAction =
        actionFilter === "all" ||
        log.action === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [auditLogs, search, actionFilter]);

  const availableActions = useMemo(() => {
    return [
      ...new Set(
        (auditLogs ?? [])
          .map(log => log.action)
          .filter(Boolean)
      )
    ];
  }, [auditLogs]);

  return (
    <div id="logs" className="tab-content active">
      <div className="section-card">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="mb-1">Logs de auditoría</h2>

            <p className="text-sm text-gray-500">
              Registro de las acciones realizadas dentro del sistema.
            </p>
          </div>

          <button
            className="btn-secondary"
            onClick={loadLogs}
            disabled={loading}
          >
            Actualizar
          </button>
        </div>

        {/* FILTROS */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar usuario, acción, entidad o ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-0"
          />

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-dashboard-item border border-dashboard-border rounded-lg px-3 py-2 text-gray-200"
          >
            <option value="all">Todas las acciones</option>

            {availableActions.map(action => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        {/* CARGA */}
        {loading && (
          <p className="text-center text-gray-400 py-8">
            Cargando registros...
          </p>
        )}

        {/* ERROR */}
        {error && (
          <p className="text-dashboard-danger text-center py-4">
            {error}
          </p>
        )}

        {/* LOGS */}
        {!loading && !error && (
          <div className="space-y-3">
            {filteredLogs.map(log => (
              <LogRow
                key={log.id}
                log={log}
              />
            ))}

            {filteredLogs.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg">
                  No se encontraron registros
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}


function LogRow({ log }) {
  const date = new Date(log.created_at);

  return (
    <div className="bg-[#303030] border border-dashboard-border rounded-lg p-4">


      {/* INFORMACIÓN PRINCIPAL */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
      
        <div className="min-w-0">
      
          <div className="flex flex-wrap items-center gap-1 text-sm text-gray-300">
      
            <span>El usuario</span>
      
            <span className="font-semibold text-dashboard-accent">
              {log.actor?.username ?? `#${log.actor_id}`}
            </span>
      
            <span>{getActionDescription(log)}</span>
      
            {log.entity_name && (
              <span className="font-semibold text-gray-200">
                {log.entity_name}
              </span>
            )}
      
          </div>
          
          <div className="mt-2 text-xs text-gray-500 text-start">
            Registro #{log.id} · {log.entity_type} #{log.entity_id ?? "—"}
          </div>
          
        </div>
          
        <div className="text-xs text-gray-500 shrink-0">
          {date.toLocaleString("es-CL")}
        </div>
          
      </div>


      {/* MIEMBROS IMPLICADOS */}
      {log.implicated_members?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 items-center">

          <span className="text-xs text-gray-500">
            Miembros:
          </span>

          {log.implicated_members.map(member => (
            <span
              key={member.id}
              className="text-xs px-2 py-1 rounded bg-dashboard-item border border-dashboard-border text-gray-300"
            >
              {member.nickname}
            </span>
          ))}

        </div>
      )}


      {/* DATOS */}
      {(log.old_data || log.new_data) && (
        <div className="mt-4 pt-3 border-t border-dashboard-border">

          <details>
            <summary className="cursor-pointer text-sm text-dashboard-accent">
              Ver detalles
            </summary>

            <div className="flex gap-3 mt-3 flex-wrap">

              {log.old_data && (
                <JsonBlock
                  title="Datos anteriores"
                  data={log.old_data}
                />
              )}

              {log.new_data && (
                <JsonBlock
                  title="Datos nuevos"
                  data={log.new_data}
                />
              )}

            </div>

          </details>

        </div>
      )}

    </div>
  );
}
function getActionDescription(log) {
  const actions = {
    "member.create": "creó al miembro",
    "member.edit": "editó al miembro",
    "member.delete": "eliminó al miembro",

    "event.create": "creó el evento",
    "event.update": "actualizó el evento",
    "event.delete": "eliminó el evento",

    "user.create": "creó al usuario",
    "user.edit": "editó al usuario",
    "user.delete": "eliminó al usuario",
  };

  return actions[log.action] ?? `realizó la acción ${log.action}`;
}

function JsonBlock({ title, data }) {
  return (
    <div className="flex-1">
      <p className="text-xs text-gray-500 mb-2 ">
        {title}
      </p>

      <pre className="
        bg-[#242424]
        border border-dashboard-border
        rounded-lg
        p-3
        text-xs
        text-gray-300
        overflow-auto
        max-h-80
      ">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}


function ActionBadge({ action }) {
  const actionNames = {
    "member.create": "Miembro creado",
    "member.edit": "Miembro editado",
    "member.delete": "Miembro eliminado",

    "event.create": "Evento creado",
    "event.update": "Evento editado",
    "event.delete": "Evento eliminado",

    "user.create": "Usuario creado",
    "user.edit": "Usuario editado",
    "user.delete": "Usuario eliminado",
  };

  return (
    <span className="
      text-xs
      px-2
      py-0.5
      rounded
      border
      border-dashboard-border
      bg-dashboard-item
      text-dashboard-accent
    ">
      {actionNames[action] ?? action}
    </span>
  );
}