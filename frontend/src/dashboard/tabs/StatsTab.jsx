
import { useMemo, useState } from "react";
import { useDashboardData } from "../../context/DataContext";
import { useModal } from "../../context/ModalContext";
import { User } from "../../entities/user.entity";
import { useUser } from "../../context/UserContext";

export default function StatsTab() {
  const { dashboardData, isLoading, error, membersById} = useDashboardData();

  // "all" = estadísticas generales
  const [selectedType, setSelectedType] = useState("all");
  const [search, setSearch] = useState("");

  const [visibleUnitIds, setVisibleUnitIds] = useState([]);
  const { openModal } = useModal()

  /** @type {{ user: User | undefined }} */
  const { user:selfUser } = useUser();

  const toggleUnitFilter = (unitId) => {
    setVisibleUnitIds(prev =>
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const eventTypes = dashboardData?.event_types || [];
  const ranks = dashboardData?.ranks || [];
  const membersByRank = dashboardData?.membersByRank || {};
  const members = dashboardData?.members || [];
  const units = dashboardData?.units || [];

  const openProfile = async(member) => {
    if(!selfUser.hasPermission('members.view'))return
    await openModal('view-member',{
      member
    })
  };

  const getStats = (member) => {
    if (selectedType === "all") {
      return member.stats || {};
    }

    return member.type_stats?.[selectedType] || {};
  };

  const getPercentage = (stats) => {
    const p = Number(stats.total_present) || 0;
    const a = Number(stats.total_absences) || 0;
    const j = Number(stats.total_justified) || 0;

    const total = p + a + j;

    return total > 0
      ? Math.round((p / total) * 100)
      : 0;
  };

  const getPercentageColor = (pct) => {
    if (pct >= 80) return "var(--success-color)";
    if (pct >= 50) return "var(--warning-color)";
    return "var(--danger-color)";
  };

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch = member.nickname
        ?.toLowerCase()
        .includes(search.toLowerCase().trim());

      const matchesUnit =
        visibleUnitIds.length === 0 ||
        visibleUnitIds.includes(member.unit_id);

      return matchesSearch && matchesUnit;
    });
  }, [members, search, visibleUnitIds]);

  const summary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let justified = 0;

    for (const member of filteredMembers) {
      const stats =
        selectedType === "all"
          ? member.stats || {}
          : member.type_stats?.[selectedType] || {};

      present += Number(stats.total_present) || 0;
      absent += Number(stats.total_absences) || 0;
      justified += Number(stats.total_justified) || 0;
    }

    const total = present + absent + justified;

    return {
      present,
      absent,
      justified,
      total,
      percentage:
        total > 0 ? Math.round((present / total) * 100) : 0,
    };
  }, [filteredMembers, selectedType]);

  if (isLoading || !dashboardData) {
    return (
      <div className="section-card text-gray-400">
        Cargando estadísticas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-card text-(--danger-color)">
        No se pudieron cargar las estadísticas.
      </div>
    );
  }

  return (
    <div id="estadisticas" className="tab-content active">
      <div className="section-card">

        {/* Encabezado */}
        <div className="mb-6">
          <h2 className="mb-1">Resumen de Rendimiento</h2>
          <p className="text-sm text-gray-500">
            Consulta las asistencias, ausencias y rendimiento de
            los integrantes.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-dashboard-item border border-[#444] rounded-lg p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-400">
                Tipo de evento
              </label>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="
                  w-full bg-[#303030] border border-[#444]
                  text-gray-200 rounded-lg px-3 py-2
                  outline-none transition
                  focus:border-(--accent-color)
                  focus:ring-1 focus:ring-(--accent-color)
                "
              >
                <option value="all">Todos los eventos</option>

                {eventTypes.map((type) => (
                  <option key={type.id} value={String(type.id)}>
                    {type.name === "mission"
                      ? "Misiones"
                      : type.name === "training"
                        ? "Entrenamientos"
                        : type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="statsSearch"
                className="text-sm font-semibold text-gray-400"
              >
                Buscar integrante
              </label>

              <input
                id="statsSearch"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre..."
                className="
                  w-full bg-[#303030] border border-[#444]
                  text-gray-200 rounded-lg px-3 py-2
                  outline-none transition
                  focus:border-(--accent-color)
                  focus:ring-1 focus:ring-(--accent-color)
                "
              />
            </div>
            

          </div>
          {/* Filtro de unidades */}
          <div className="mt-5 pt-4 border-t border-[#444]">
            <div className="text-sm font-semibold text-gray-400 mb-2">
              Unidades
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setVisibleUnitIds([])}
                className={`px-2 py-1 rounded-lg border text-sm font-semibold transition cursor-pointer ${
                  visibleUnitIds.length === 0
                    ? "bg-[#756328]/25 border-(--accent-color) text-(--accent-color)"
                    : "bg-[#303030] border-[#444] text-gray-400 hover:bg-[#383838]"
                }`}
              >
                Todas
              </button>
              
              {units.map(unit => {
                const selected = visibleUnitIds.includes(unit.id);
              
                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => toggleUnitFilter(unit.id)}
                    className={`px-2 py-1 rounded-lg border text-sm font-semibold transition cursor-pointer ${
                      selected
                        ? "bg-[#756328]/25 border-(--accent-color) text-(--accent-color)"
                        : "bg-[#303030] border-[#444] text-gray-400 hover:bg-[#383838]"
                    }`}
                  >
                    {unit.short_name || unit.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">

          {[
            {
              label: "Presentes",
              value: summary.present,
              color: "var(--success-color)",
            },
            {
              label: "Ausencias",
              value: summary.absent,
              color: "var(--danger-color)",
            },
            {
              label: "Justificados",
              value: summary.justified,
              color: "var(--warning-color)",
            },
            {
              label: "Asistencia",
              value: `${summary.percentage}%`,
              color: getPercentageColor(summary.percentage),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="
                bg-[#363636] border border-[#444]
                rounded-lg p-4 transition
                hover:border-[#666]
              "
            >
              <div className="text-xs text-gray-500 mb-2">
                {item.label}
              </div>

              <div
                className="text-2xl font-bold"
                style={{ color: item.color }}
              >
                {item.value}
              </div>
            </div>
          ))}

        </div>

        {/* Tablas por rango */}
        <div className="space-y-6" id="statsContainer">

          {ranks.map((rank) => {
            const rankMembers = (membersByRank[rank.id] || [])
              .filter((member) => {
                const matchesSearch = member.nickname
                  ?.toLowerCase()
                  .includes(search.toLowerCase().trim());
              
                const matchesUnit =
                  visibleUnitIds.length === 0 ||
                  visibleUnitIds.includes(member.unit_id);
              
                return matchesSearch && matchesUnit;
              });

            if (rankMembers.length === 0) return null;

            return (
              <div
                key={rank.id}
                className="
                  bg-[#242424] border border-[#444]
                  rounded-lg overflow-hidden
                "
              >

                {/* Encabezado del rango */}
                <div className="
                  flex items-center justify-between
                  px-5 py-3 bg-[#333]
                  border-b border-[#444]
                ">
                  <div className="flex items-center gap-3">
                    <div className="
                      w-1 h-7 rounded-full
                      bg-(--accent-color)
                    " />

                    <div>
                      <h3 className="border-0 p-0 mb-0">
                        {rank.plural_name}
                      </h3>

                      <span className="text-xs text-gray-500">
                        {rankMembers.length}{" "}
                        {rankMembers.length === 1
                          ? "integrante"
                          : "integrantes"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabla responsive */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="bg-[#292929] text-gray-400">
                      <tr className="border-b border-[#444]">
                        <th className="text-left px-5 py-3 font-semibold">
                          Integrante
                        </th>
                        <th className="px-3 py-3 font-semibold">
                          Pres.
                        </th>
                        <th className="px-3 py-3 font-semibold">
                          Aus.
                        </th>
                        <th className="px-3 py-3 font-semibold">
                          Avisos
                        </th>
                        {selectedType === "all" && (
  <th
    className="px-3 py-3 font-semibold"
    title="Ausencias consecutivas generales"
  >
    Consecutivas
  </th>
)}
                        <th className="px-5 py-3 font-semibold">
                          Asistencia
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#393939]">
                      {rankMembers.map((member) => {
                        const stats = getStats(member);

                        const p = Number(stats.total_present) || 0;
                        const a = Number(stats.total_absences) || 0;
                        const j = Number(stats.total_justified) || 0;

                        const consecutive =
                          Number(member.stats?.consecutive_absences) || 0;

                        const total = p + a + j;
                        const pct = getPercentage(stats);
                        const color = getPercentageColor(pct);

                        return (
                          <tr
                            key={member.id}
                            className="
                              bg-dashboard-item
                              hover:bg-[#353535]
                              transition-colors
                            "
                          >
                            {/* Miembro */}
                            <td className="px-5 py-3">
                              <button
                                type="button"
                                onClick={() => openProfile(member)}
                                className="
                                  flex items-center gap-3
                                  text-left group cursor-pointer
                                "
                              >
                                <div className="
                                  w-9 h-9 shrink-0
                                  rounded-full bg-[#454545]
                                  border border-[#555]
                                  flex items-center justify-center
                                  font-bold text-(--accent-color)
                                ">
                                  {member.nickname?.charAt(0)?.toUpperCase() || "?"}
                                </div>

                                <div className="min-w-0">
                                  <span className="
                                    text-gray-300 font-semibold
                                    group-hover:text-(--accent-color)
                                    transition-colors
                                  ">
                                    {rank.short_name && (
                                      <span className="text-gray-500">
                                        [{rank.short_name}]{" "}
                                      </span>
                                    )}
                                    {member.nickname}
                                  </span>
                                </div>
                              </button>
                            </td>

                            {/* Presentes */}
                            <td className="text-center px-3 py-3">
                              <span className="text-(--success-color) font-semibold">
                                {p}
                              </span>
                            </td>

                            {/* Ausencias */}
                            <td className="text-center px-3 py-3">
                              <span className="text-(--danger-color) font-semibold">
                                {a}
                              </span>
                            </td>

                            {/* Justificados */}
                            <td className="text-center px-3 py-3">
                              <span className="text-(--warning-color) font-semibold">
                                {j}
                              </span>
                            </td>

                            {/* Consecutivas globales */}
{/* Consecutivas globales */}
{selectedType === "all" && (
  <td className="text-center px-3 py-3">
    <span
      className={`
        inline-flex min-w-8 justify-center
        rounded-md px-2 py-1
        text-xs font-bold border
        ${
          consecutive === 0
            ? "bg-[#303030] border-[#444] text-gray-500"
            : consecutive >= 3
              ? "bg-red-900/30 border-red-800 text-(--danger-color)"
              : "bg-yellow-900/20 border-yellow-800 text-(--warning-color)"
        }
      `}
      title="Faltas consecutivas en todos los eventos"
    >
      {consecutive}
    </span>
  </td>
)}
                            {/* Porcentaje + barra */}
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="
                                  flex-1 h-2 bg-[#454545]
                                  rounded-full overflow-hidden
                                ">
                                  <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                      width: `${pct}%`,
                                      backgroundColor: total > 0 ? color : "#666",
                                    }}
                                  />
                                </div>

                                <span
                                  className="font-bold text-xs w-10 text-right"
                                  style={{
                                    color: total > 0 ? color : "#888",
                                  }}
                                >
                                  {total > 0 ? `${pct}%` : "—"}
                                </span>
                              </div>
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

              </div>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="
              text-center py-12 text-gray-500
              bg-[#242424] rounded-lg
              border border-[#444]
            ">
              No se encontraron integrantes.
            </div>
          )}

        </div>

        {/* Información */}
        <div className="
          mt-6 pt-4 border-t border-[#444]
          text-xs text-gray-500 space-y-1
        ">
          <p>
            El porcentaje se calcula como:
            presentes / (presentes + ausencias + justificados).
          </p>

          <p>
            Los resúmenes consideran los integrantes visibles
            según la búsqueda.
          </p>
        </div>

      </div>
    </div>
  );
}
