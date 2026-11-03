
import { useEffect, useState } from "react";
import { useModal } from "../../context/ModalContext";

const STORAGE_KEY = "milsim_last_seen_version";

// Compara versiones ignorando PATCH.
// Retorna true cuando version es posterior a previous.
function isNewerRelease(version, previous) {
  if (!previous) return true;

  const [major, minor] = version.split(".").map(Number);
  const [prevMajor, prevMinor] = previous.split(".").map(Number);

  return (
    major > prevMajor ||
    (major === prevMajor && minor > prevMinor)
  );
}

const changeTypes = {
  feature: {
    label: "Nuevo",
    symbol: "+",
    color: "text-green-400"
  },
  improvement: {
    label: "Mejora",
    symbol: "✓",
    color: "text-blue-400"
  },
  fix: {
    label: "Corrección",
    symbol: "✕",
    color: "text-yellow-400"
  },
  security: {
    label: "Seguridad",
    symbol: "!",
    color: "text-orange-400"
  }
};

export default function WhatsNewModal({
  currentVersion,
  lastSeenVersion
}) {
  const { closeModal } = useModal();

  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadChangelog = async () => {
      try {
        const response = await fetch(
          `/changelog.json?v=${currentVersion}`
        );

        if (!response.ok) {
          throw new Error("No se pudieron cargar las novedades");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Formato de changelog inválido");
        }

        // Solo versiones posteriores a la última vista,
        // sin superar la versión instalada.
        const pending = data.filter(release =>
          isNewerRelease(release.version, lastSeenVersion) &&
          !isNewerRelease(release.version, currentVersion)
        );

        if (mounted) {
          setReleases(pending);
        }

      } catch (err) {
        if (mounted) setError(err.message);

      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadChangelog();

    return () => {
      mounted = false;
    };
  }, [currentVersion, lastSeenVersion]);

  const closeHandler = () => {
    // Solo marcar como vista si se cargaron novedades.
    if (!error && !loading && releases.length > 0) {
      localStorage.setItem(
        STORAGE_KEY,
        currentVersion
      );
    }

    closeModal();
  };

  const formatDate = (date) => {
    if (!date) return null;

    return new Date(`${date}T12:00:00`).toLocaleDateString(
      "es-CL",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm">

      <div className="w-[95%] max-w-xl max-h-[90vh] bg-dashboard-card rounded-dashboard border border-dashboard-accent shadow-2xl flex flex-col">

        {/* HEADER */}
        <div className="relative px-6 py-4 border-b border-dashboard-border">

          <h2 className="mb-0! text-xl text-center border-b-0 m-0 p-0">
            Novedades
          </h2>

          <p className="text-sm text-gray-500 mt-1 text-center">
            Ultimas novedades desde tu última visita.
          </p>

          <button
            onClick={closeHandler}
            className="absolute right-4 top-3 text-3xl text-gray-500 hover:text-white transition"
            aria-label="Cerrar"
          >
            ×
          </button>

        </div>

        {/* CONTENIDO */}
        <div className="px-6 py-5 overflow-y-auto flex-1">

          {loading && (
            <p className="text-sm text-gray-400 text-center py-8">
              Cargando novedades...
            </p>
          )}

          {error && (
            <p className="text-sm text-dashboard-danger text-center py-8">
              {error}
            </p>
          )}

          {!loading && !error && releases.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-8">
              No hay novedades pendientes.
            </p>
          )}

          {!loading && !error && (
            <div className="space-y-6">

              {releases.map(release => (
                <div key={release.version}>

                  {/* VERSIÓN */}
                  <div className="flex flex-wrap flex-col items-center justify-between mb-3">


                      <h3 className="text-lg font-semibold text-dashboard-accent p-0 m-0 ">
                        {release.title || `Versión ${release.version}`}
                      </h3>

                      <p className="text-xs text-gray-500 mt-1">
                        Versión {release.version}
                        {release.date && ` · ${formatDate(release.date)}`}
                      </p>


                  </div>

                  {/* CAMBIOS */}
                  <div className="space-y-2">

                    {(release.changes ?? []).map((change, index) => {
                      const type = changeTypes[change.type] ?? {
                        label: "Cambio",
                        symbol: "•",
                        color: "text-gray-400"
                      };

                      return (
                        <div
                          key={index}
                          className="bg-dashboard-item border border-dashboard-border rounded-lg p-3"
                        >

                          <div className="flex items-center justify-start gap-3">

                            <span className={`text-lg font-semibold shrink-0 ${type.color}`}>
                              {type.symbol}
                            </span>

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="text-sm font-medium text-gray-200">
                                  {change.title}
                                </span>

                                <span className={`text-xs ${type.color}`}>
                                  {type.label}
                                </span>

                              </div>

                              {change.description && (
                                <p className=" text-start text-xs text-gray-400 m-0 p-0 pb-1">
                                  {change.description}
                                </p>
                              )}

                            </div>

                          </div>

                        </div>
                      );
                    })}

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="flex justify-end px-6 py-4 border-t border-dashboard-border">

          <button
            onClick={closeHandler}
            className="btn-primary"
          >
            Entendido
          </button>

        </div>

      </div>

    </div>
  );
}
