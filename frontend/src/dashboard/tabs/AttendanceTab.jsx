
import { useEffect, useState } from 'react'
import { useDashboardData } from '../../context/DataContext';
import { useModal } from '../../context/ModalContext';
import { ALERT_TYPES, useAlertGlobal } from '../../context/AlertContext';

//NOTA: Este componente se volverá muy grande, se planea refactorisarlo en el futuro, 
// se evitara usar inmutable data, el current event solo se usara para las nuevas asistencias, y se usara dashboardData para las asistencias existentes. y separar en componentes mas pequeño. 

const newDefEvent ={
      isNew: true,
      date: new Date().toISOString().split("T")[0], // formato YYYY-MM-DD
      attendance: {}, // "member_id": { estado: 'P', comentario: '' }
      internalId: null, // solo para eventos existentes, no para nuevos
      name: "nuevo_evento" ,
      description: "",
      type_id: 2
    
    }

export default function AttendanceTab({


}) {

  const [change, setChange] =useState(null) // cuando hay cambios gurdar los objetos cambiados aqui{}
  const [inmutableEvent, setInmutableEvent] = useState(null) // cuando el evento ya existe y se quiere editar y comparar con el original


  const [commentsVisible, setCommentsVisible] = useState({});   
  const [AllSelector, setAllSelector] = useState("A"); // "P", "A", "C"

  // Filtro de unidades: vacío = todas las unidades.
  const [visibleUnitIds, setVisibleUnitIds] = useState([]);

  const toggleUnitFilter = (unitId) => {
    setVisibleUnitIds(prev =>
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const { dashboardData, isLoading, error, saveNewEventAndAttendace, loadAttendancebyId, reloadData, updateEventAndAttendace, unitsById } = useDashboardData();
  const {openModal } = useModal();
  const [currentEvent, setCurrentEvent] = useState(structuredClone(newDefEvent));
  const [selectCurrentEvent, setSelectCurrentEvent] = useState('new');
  const {addGlobalAlert, toggleGlobalLoading} = useAlertGlobal();
  
  // funcion para abrir el modal de IA
  const prompIaHandler = async()=>{
    await openModal('insert-Attendace-IA', {
      event:currentEvent,
      saveEventFunction:(newEvent)=>{
        setCurrentEvent((actual)=>{
          return{
            ...actual,
            ...newEvent
          }
        })
        addGlobalAlert({
                estado: ALERT_TYPES.SUCCESS,
                msg: 'IA generó la asistencia correctamente'
        });
      }
    });
    //toggleGlobalLoading()
    
  }
//  usefect para  recargar el data  del current evento para que tenga los ultimos cambios en la asitencia si es que no se esta editando (para el proximo refactor  se simplificara)
useEffect(() => {
  if (currentEvent.isNew) return;
  if (change) return;
  if (!selectCurrentEvent || selectCurrentEvent === "new") return;
  syncCurrentEvent();


}, [dashboardData, change]
);
  // funcion: para actualizar la asistencia de todos los miembros cuando se cambia el AllSelector
  useEffect(() => {
    if (!AllSelector || !dashboardData?.members) return;

    setCurrentEvent(prev => {
      if (!prev.isNew) return prev;

      const estado = AllSelector;
      const attendance = {
        ...prev.attendance
      };


      dashboardData.members.filter(m => visibleUnitIds.length === 0 || visibleUnitIds.includes(m.unit_id)).forEach(m => {
        attendance[m.id] = {
          estado,
          comentario: attendance[m.id]?.comentario || ""
        };
      });
      return {
        ...prev,
        attendance
      };
    });

  }, [AllSelector, dashboardData]);
  // Mantener en currentEvent.attendance solo integrantes de unidades visibles.
  useEffect(() => {
    if (!dashboardData?.members) return;

    const allowedIds = new Set(
      dashboardData.members
        .filter(m => visibleUnitIds.length === 0 || visibleUnitIds.includes(m.unit_id))
        .map(m => String(m.id))
    );

    setCurrentEvent(prev => {
      const attendance = Object.fromEntries(
        Object.entries(prev.attendance || {}).filter(([id]) => allowedIds.has(id))
      );

      // Al volver a mostrar una unidad en un evento nuevo, inicializarla.
      if (prev.isNew) {
        for (const id of allowedIds) {
          if (!attendance[id]) attendance[id] = { estado: AllSelector, comentario: "" };
        }
      }

      const oldIds = Object.keys(prev.attendance || {});
      if (oldIds.length === Object.keys(attendance).length &&
          oldIds.every(id => attendance[id] === prev.attendance[id])) return prev;

      return { ...prev, attendance };
    });

    // Evitar enviar cambios pendientes de unidades ocultas en eventos existentes.
    setChange(prev => {
      if (!prev?.attendance) return prev;
      const attendance = Object.fromEntries(
        Object.entries(prev.attendance).filter(([id]) => allowedIds.has(id))
      );
      const next = { ...prev };
      if (Object.keys(attendance).length) next.attendance = attendance;
      else delete next.attendance;
      return Object.keys(next).length ? next : null;
    });
  }, [visibleUnitIds, dashboardData?.members]);

  // useefect vacio 
  useEffect(() => {
    console.log("cuventrren :", structuredClone(currentEvent));
  }, [currentEvent]);

  
  const toggleMemberAttendance = (member, estado, comentario) => {
    // Si el estado es "J", mostrar el textarea de comentarios, sino ocultarlo

    const newComentario = comentario || '';

    setCommentsVisible(prev => ({
      ...prev,
      [member.id]: estado === "J"
    }));

    // Actualizar el estado de asistencia del miembro
    setCurrentEvent(prev => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [member.id]: {
          estado,
          comentario: newComentario || prev?.attendance[member.id]?.comentario || ''
        }
      }
    }));

    if (!inmutableEvent || currentEvent.isNew) return;

    const original = inmutableEvent.attendance[member.id];

    const isDifferent =
      original?.estado !== estado ||
      original?.comentario !== newComentario;

    setChange(prev => {
      const newChanges = { ...prev };

      if (isDifferent) {
        newChanges.attendance = {
          ...(prev?.attendance || {}),
          [member.id]: { estado, comentario: newComentario }
        };
      } else {
        // eliminar si volvió al estado original
        if (prev?.attendance) {
          const { [member.id]: _, ...rest } = prev.attendance;

          if (Object.keys(rest).length === 0) {
            delete newChanges.attendance;
          } else {
            newChanges.attendance = rest;
          }
        }
      }

      return Object.keys(newChanges).length === 0 ? null : newChanges;
    });

  };



  const loadAttendanceForDate = (e) => {
    const selectedDate = e.target.value;
    setCurrentEvent(prev => ({
      ...prev,
      date: selectedDate
    }));

  };
  // guardar la asistencia de evento nuevo o existente
  const saveAttendanceHandler = async () => {
      if(isBlock) return
      if (!currentEvent.isNew) {
        const ok =await updateEventAndAttendace(change, inmutableEvent.internalId)
        if(ok){
          //syncCurrentEvent()
          setChange(null)
          addGlobalAlert({
            estado: ALERT_TYPES.SUCCESS,
            msg: 'Evento actualizado correctamente'
          });
          return
        }
        addGlobalAlert({
          estado: ALERT_TYPES.ERROR,
          msg: 'Error al actualizar el evento'
        });
        return

      }
      const id =await saveNewEventAndAttendace(currentEvent);
      if (id && id !== "error") {
        setSelectCurrentEvent(`${id}`);
        addGlobalAlert({
          estado: ALERT_TYPES.SUCCESS,
          msg: 'Evento creado correctamente'
        });
      }else{
        addGlobalAlert({ 
          estado: ALERT_TYPES.ERROR,
          msg: 'Error al crear el evento'
        });
      }



  };
const syncCurrentEvent = async (sourceData = dashboardData) => {
   
      const eventId = selectCurrentEvent;
      if (eventId==='new')return

      setChange(null);
      setCommentsVisible({});

      let attendance = sourceData.attendances[eventId] || null;

      if (attendance===null) {
        attendance = await loadAttendancebyId(eventId);
      }
      const event= sourceData.events.find(ev => ev.id === parseInt(eventId))

      const date = event?.event_date.split("T")[0] || new Date().toISOString().split("T")[0]
      const name =event?.name || "evento_desconocido"
      const description = event?.description || ""
      const type_id = event?.type_id || null
      const cloneAttendace= structuredClone(attendance || {})
      setCurrentEvent({
        isNew: false,
        date:date ,
        attendance: Object.fromEntries(
          Object.entries(cloneAttendace).filter(([id]) => {
            const member = sourceData.members.find(m => String(m.id) === id);
            return member && (visibleUnitIds.length === 0 || visibleUnitIds.includes(member.unit_id));
          })
        ),
        internalId: eventId,
        name: name,
        description: description,
        type_id: type_id
      });
      setInmutableEvent({
        date: date,
        attendance: cloneAttendace,
        internalId: eventId,
        name: name,
        type_id: type_id
      })
};

  // useefect para cargar la asistencia del evento seleccionado
  useEffect(() => {
    syncCurrentEvent();
  }, [selectCurrentEvent]);

  let textSumit = currentEvent.isNew  ? "Guardar Nuevo Evento" : "Actualizar Evento Existente";

  // funcion para cambiar el evento actual
  const setCurrentEventHandler = async (eventId) => {
    setSelectCurrentEvent(eventId);
    // Si es un evento nuevo, inicializar la asistencia de todos los miembros
    if (eventId === "new" && !currentEvent?.isNew) {
      const attendance = {};
    
      dashboardData.members.filter(member => visibleUnitIds.length === 0 || visibleUnitIds.includes(member.unit_id)).forEach(member => {
        attendance[member.id] = {
          estado: AllSelector,
          comentario: ""
        };
      });
      setCurrentEvent({
        ...structuredClone(newDefEvent),
        attendance
      });
      setInmutableEvent(null)
      setChange(null)
      setCommentsVisible({})
    }
  }

  const cancelEditHandler = async ()=>{
    setCurrentEvent({
      ...structuredClone(inmutableEvent),
      isNew:false
    }) 
    setChange(null)
  }


  let isBlock=false
  if (!currentEvent.isNew){
    isBlock= (!change || Object.keys(change).length === 0) ? true : false
  }
  const generalvaluesEventChangeHandler = (key, value)=>{
    setCurrentEvent(prev => ({
                    ...prev,
                    [key]: value
                  }))
    if(currentEvent.isNew) return

    setChange(prev => ({
                    ...prev,
                    [key]: value
                  }))

  }
    



return (
  <>
    {/* TAB: REGISTRO DIARIO */}
    <div id="registro" className="tab-content active">
      <div className="section-card">

        {/* Header */}
        <div className="mb-6">
          <h2 className="mb-1">
            Registro de Asistencia
          </h2>

          <p className="text-sm text-gray-500">
            Crea o edita eventos y registra la asistencia de los miembros.
          </p>
        </div>


        {/* Configuración del evento */}
        <div className="bg-dashboard-item border border-[#444] rounded-lg p-5 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Evento */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-400">
                Evento
              </label>

              <select
                value={selectCurrentEvent}
                onChange={(e) =>
                  setCurrentEventHandler(e.target.value)
                }
                className="
                  w-full
                  bg-[#303030]
                  border border-[#444]
                  text-gray-200
                  rounded-lg
                  px-3
                  py-2
                  outline-none
                  transition
                  focus:border-(--accent-color)
                  focus:ring-1
                  focus:ring-(--accent-color)
                "
              >
                {dashboardData?.events?.map(ev => (
                  <option
                    key={`options${ev.id}`}
                    value={ev.id}
                  >
                    {ev.name} - {ev.event_date.split("T")[0]}
                  </option>
                ))}

                <option value="new">
                  Nuevo Evento
                </option>
              </select>
            </div>


            {/* Fecha */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-400">
                📅 Fecha del Evento
              </label>

              <input
                type="date"
                id="dateSelector"
                onChange={loadAttendanceForDate}
                value={currentEvent.date}
                readOnly={!currentEvent.isNew}
                className="
                  w-full
                  bg-[#303030]
                  border border-[#444]
                  text-gray-200
                  rounded-lg
                  px-3
                  py-2
                  outline-none
                  transition
                  focus:border-(--accent-color)
                  focus:ring-1
                  focus:ring-(--accent-color)
                  read-only:opacity-60
                  read-only:cursor-not-allowed
                "
              />
            </div>


            {/* Nombre */}
            <div className="flex flex-col gap-2 md:col-span-1">
              <label className="text-sm font-semibold text-gray-400">
                Nombre del Evento
              </label>

              <input
                type="text"
                id="eventName"
                value={currentEvent.name}
                onChange={e =>
                  setCurrentEvent(prev => ({
                    ...prev,
                    name: e.target.value
                  }))
                }
                readOnly={!currentEvent.isNew}
                placeholder="Ej: Entrenamiento semanal"
                className="
                  w-full
                  bg-[#303030]
                  border border-[#444]
                  text-gray-200
                  placeholder:text-gray-600
                  rounded-lg
                  px-3
                  py-2
                  outline-none
                  transition
                  focus:border-(--accent-color)
                  focus:ring-1
                  focus:ring-(--accent-color)
                  read-only:opacity-60
                  read-only:cursor-not-allowed
                "
              />
            </div>

            {/* type selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-400">
                Tipo de Evento
              </label>

              <select
                value={currentEvent.type_id || ""}
                onChange={(e) =>
                  generalvaluesEventChangeHandler('type_id', e.target.value)
                }
                className="
                  w-full
                  bg-[#303030]
                  border border-[#444]
                  text-gray-200
                  rounded-lg
                  px-3
                  py-2
                  outline-none
                  transition
                  focus:border-(--accent-color)
                  focus:ring-1
                  focus:ring-(--accent-color)
                "
              >
                {dashboardData?.event_types?.map(et => (
                  <option
                    key={`options${et.id}`}
                    value={et.id}
                  >
                    {et.name}
                  </option>
                ))}

                <option value="" disabled>
                  Selecciona un tipo
                </option>
              </select>
            </div>

            {!currentEvent.isNew? '':(<label className=' col-span-2'>
              <button
                type="button"
                onClick={() => prompIaHandler()}
                className="
                  group
                  inline-flex items-center justify-center gap-3
                  px-4 py-2.5
                  rounded-dashboard
                  bg-[#303030]
                  hover:bg-[#383838]
                  border border-[#756328]
                  hover:border-dashboard-accent
                  text-dashboard-text
                  text-sm font-semibold
                  shadow-sm shadow-black/20
                  hover:shadow-md hover:shadow-dashboard-accent/10
                  transition-all duration-200
                  cursor-pointer
                "
              >
                {/* Icono de IA */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="
                    shrink-0
                    text-dashboard-accent
                    transition-transform duration-300
                    group-hover:rotate-12
                    group-hover:scale-110
                  "
                >
                  <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z" />
                  <path d="M19 17l.7 1.3L21 19l-1.3.7L19 21l-.7-1.3L17 19l1.3-.7L19 17z" />
                </svg>
                          
                {/* Texto */}
                <span className="whitespace-nowrap">
                  Generar asistencia con IA
                </span>
                          
                {/* Flecha animada */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="
                    shrink-0
                    text-dashboard-accent
                    opacity-60
                    transition-all duration-200
                    group-hover:opacity-100
                    group-hover:translate-x-1
                  "
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </label>)}
          </div>

          {/* Selector de unidades para la asistencia del evento */}
          <div className="mt-5 pt-4 border-t border-[#444]">
            <div className="text-sm font-semibold text-gray-400 mb-2">
              Unidades participantes
            </div>
            <div className="flex flex-wrap gap-0.9">
              <button
                type="button"
                onClick={() => setVisibleUnitIds([])}
                aria-pressed={visibleUnitIds.length === 0}
                className={`px-2 py-1 rounded-lg border text-sm font-semibold transition cursor-pointer ${
                  visibleUnitIds.length === 0
                    ? "bg-[#756328]/25 border-(--accent-color) text-(--accent-color)"
                    : "bg-[#303030] border-[#444] text-gray-400 hover:bg-[#383838]"
                }`}
              >
                All units
              </button>
              {(dashboardData?.units || []).map(unit => {
                const selected = visibleUnitIds.includes(unit.id);
                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => toggleUnitFilter(unit.id)}
                    aria-pressed={selected}
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
            <p className="text-xs text-gray-500 mt-2">
              Solo se guardan las asistencias de las unidades seleccionadas al crear el evento.
            </p>
          </div>

        </div>


        {/* Selector global */}
        {currentEvent.isNew && (
          <div className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-3
          bg-dashboard-item
            
            border
            border-[#444]
            rounded-lg
            px-5
            py-4
            mb-6
          ">

            <div>
              <div className="text-sm font-semibold text-gray-300">
                Asistencia global
              </div>

              <div className="text-xs text-gray-500 mt-1">
                Aplica el estado seleccionado a los miembros.
              </div>
            </div>


            <div className="flex items-center gap-2">

              {["P", "A", "C"].map(val => {

                const selected = AllSelector === val;

                return (
                  <label
                    key={val}
                    className={`
                      flex
                      items-center
                      gap-2
                      px-3
                      py-2
                      rounded-lg
                      border
                      cursor-pointer
                      transition
                      text-sm
                      font-semibold

                      ${
                        selected
                          ? val === "P"
                            ? "bg-green-900/30 border-green-700 text-(--success-color)"
                            : val === "A"
                              ? "bg-red-900/30 border-red-700 text-(--danger-color)"
                              : "bg-gray-700/40 border-gray-600 text-gray-300"
                          : "bg-[#303030] border-[#444] text-gray-500 hover:bg-[#383838] hover:text-gray-300"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name={`allSelector_${val}`}
                      checked={selected}
                      onChange={() => setAllSelector(val)}
                      className="accent-(--accent-color)"
                    />

                    {val === "C" ? "Clear" : val}
                  </label>
                );
              })}

            </div>
          </div>
        )}


        {/* Lista de asistencia */}
        <div id="attendanceFormsContainer" className="space-y-6">

          {dashboardData?.ranks?.map(rank => {

            const membersInRank =
              (dashboardData?.membersByRank?.[rank.id] || []).filter(member =>
                visibleUnitIds.length === 0 || visibleUnitIds.includes(member.unit_id)
              );

            if (membersInRank.length === 0) return null;

            return (
              <div
                key={rank.id}
                className="
                  bg-[#242424]
                  border
                  border-[#444]
                  rounded-lg
                  overflow-hidden
                "
              >

                {/* Header del rango */}
                <div className="
                  flex
                  items-center
                  justify-between
                  px-5
                  py-3
                  bg-[#333]
                  border-b
                  border-[#444]
                ">

                  <div className="flex items-center gap-3">

                    <div
                      className="
                        w-1
                        h-7
                        rounded-full
                        bg-(--accent-color)
                      "
                    />

                    <div>
                      <h3 className="border-0 p-0 mb-0">
                        {rank.plural_name}
                      </h3>

                      <span className="text-xs text-gray-500">
                        {membersInRank.length}{" "}
                        {membersInRank.length === 1
                          ? "miembro"
                          : "miembros"}
                      </span>
                    </div>

                  </div>

                </div>


                {/* Miembros */}
                <div className="divide-y divide-[#444]">

                  {membersInRank.map(member => {

                    const entry =
                      currentEvent.attendance?.[member.id] || {
                        estado: "",
                        comentario: ""
                      };

                    const visible =
                      commentsVisible[member.id] ??
                      entry.estado === "J";

                    return (
                      <div
                        key={member.id}
                        className="
                          px-5
                          py-4
                          transition
                          bg-dashboard-item
                          hover:bg-[#3a3a3a]
                        "
                      >

                        {/* Información + asistencia */}
                        <div className="
                          flex
                          flex-col
                          lg:flex-row
                          lg:items-center
                          gap-4
                        ">

                          {/* Nombre e info */}
                          <div className="flex-1 min-w-0">

                            <div className="
                              flex
                              items-center
                              gap-2
                              min-w-0
                            ">
                              
                              {/* Logo */}
                              <div
                                className="
                                  w-9
                                  h-9
                                  shrink-0
                                  rounded-full
                                  bg-[#454545]
                                  border
                                  border-[#555]
                                  flex
                                  items-center
                                  justify-center
                                  text-sm
                                  font-bold
                                  text-(--accent-color)
                                "
                              >
                                {member.nickname
                                  ?.charAt(0)
                                  ?.toUpperCase() || "?"}

                                
                              </div>
                              
                              {/* short rank y name */}
                              <div className='text-sm font-semibold text-gray-300 truncate'>
                                <span className='text-gray-500'>
                                  {rank.short_name !== ""
                                  ? `[${rank.short_name}] `
                                  : ""}
                                </span>
                                <span className="">                       

                                  {member.nickname}

                                </span>
                              </div>

                              {/* unidad  */}
                              {unitsById[member.unit_id]?.logo_url && (
                                <div
                                  className="
                                    ml-1
                                    h-8 w-8
                                    shrink-0
                                    rounded-full
                                    bg-[#2b2b2b]
                                    border border-[#555]
                                    p-0.5
                                    flex items-center justify-center
                                    overflow-hidden
                                    transition
                                    hover:border-(--accent-color)
                                    hover:scale-110
                                  "
                                  title={unitsById[member.unit_id]?.name || "Unidad"}
                                >
                                  <img
                                    src={unitsById[member.unit_id]?.logo_url}
                                    alt={unitsById[member.unit_id]?.name || "Unidad"}
                                    className="
                                      h-full w-full
                                      rounded-full
                                      object-cover
                                    "
                                  />
                                </div>
                              )}

                            </div>

                          </div>


                          {/* Opciones */}
                          <div className="
                            flex
                            flex-wrap
                            gap-2
                          ">

                            {["P", "A", "J"].map(val => {

                              const selected =
                                entry.estado === val;

                              return (
                                <label
                                  key={val}
                                  className={`
                                    flex
                                    items-center
                                    gap-2
                                    px-3
                                    py-2
                                    rounded-lg
                                    border
                                    cursor-pointer
                                    transition
                                    text-xs
                                    font-semibold

                                    ${
                                      selected
                                        ? val === "P"
                                          ? "bg-green-900/30 border-green-700 text-(--success-color)"
                                          : val === "A"
                                            ? "bg-red-900/30 border-red-700 text-(--danger-color)"
                                            : "bg-yellow-900/30 border-yellow-700 text-(--warning-color)"
                                        : "bg-[#303030] border-[#444] text-gray-500 hover:bg-[#383838] hover:text-gray-300"
                                    }
                                  `}
                                >

                                  <input
                                    type="radio"
                                    name={`att_${member.id}`}
                                    value={val}
                                    checked={selected}
                                    onChange={() =>
                                      toggleMemberAttendance(
                                        member,
                                        val,
                                        ""
                                      )
                                    }
                                    className="accent-(--accent-color)"
                                  />

                                  {val === "J" ? "Aviso" : val}

                                </label>
                              );
                            })}

                          </div>

                        </div>


                        {/* Comentario */}
                        {visible && (
                          <div className="mt-3">

                            <textarea
                              value={entry.comentario || ""}
                              onChange={e =>
                                toggleMemberAttendance(
                                  member,
                                  entry.estado,
                                  e.target.value
                                )
                              }
                              placeholder="Escribe el motivo del aviso..."
                              className="
                                w-full
                                min-h-20
                                bg-[#303030]
                                border
                                border-[#444]
                                text-gray-200
                                placeholder:text-gray-600
                                rounded-lg
                                px-3
                                py-2
                                text-sm
                                resize-y
                                outline-none
                                transition
                                focus:border-(--accent-color)
                                focus:ring-1
                                focus:ring-(--accent-color)
                              "
                            />

                          </div>
                        )}

                      </div>
                    );
                  })}

                </div>

              </div>
            );
          })}

        </div>


        {/* Botones */}
        <div className="
          flex
          flex-col-reverse
          sm:flex-row
          gap-3
          justify-end
          mt-6
          pt-5
          border-t
          border-[#444]
        ">

          {(!isBlock && !currentEvent.isNew) && (
            <button
              onClick={cancelEditHandler}
              className="
                px-4
                py-2
                rounded-lg
                bg-[#444]
                border
                border-[#555]
                text-gray-300
                text-sm
                font-semibold
                hover:bg-[#505050]
                hover:text-white
                transition
              "
            >
              Cancelar Cambios
            </button>
          )}

          <button
            onClick={() => saveAttendanceHandler()}
            disabled={isBlock}
            className={`
              px-4
              py-2
              rounded-lg
              text-sm
              font-bold
              transition

              ${
                isBlock
                  ? "bg-[#454545] text-gray-500 cursor-not-allowed opacity-60"
                  : "bg-(--accent-color) text-black hover:opacity-90 cursor-pointer"
              }
            `}
          >
            {textSumit}
          </button>

        </div>

      </div>
    </div>
  </>
);

}
