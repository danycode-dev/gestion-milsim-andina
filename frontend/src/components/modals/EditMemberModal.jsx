
import { useState } from "react";
import { useDashboardData } from "../../context/DataContext";
import { useModal } from "../../context/ModalContext";
import { ALERT_TYPES, useAlertGlobal } from "../../context/AlertContext";

export default function EditMemberModal({
    member = {
        id: "",
        nickname: "",
        rank_id: "",
        unit_id:"",
    }
}) {
  const {ranksById, dashboardData, isLoading, error, reloadData, membersById, updateMember } = useDashboardData();

    const {addGlobalAlert} = useAlertGlobal();
    const { closeModal } = useModal();
    const [values, setValues] = useState(
        {
            nickname:member.nickname,
            rank_id:member.rank_id,
            unit_id:member.unit_id
        }
    )
    const summitHandler = async ()=>{
        const changes = {}

        for(const keyValue in values){
            if (values[keyValue]===member[keyValue]) continue
            
            changes[keyValue] = values[keyValue]
        }
        console.log(changes)
        try{
            await updateMember(changes, member.id)
            addGlobalAlert({
                estado:ALERT_TYPES.SUCCESS,
                msg: 'miembro actualizado'
            })            
            closeModal('miembro actualizado')
        }catch(e){
            console.error(e)
            addGlobalAlert({
                estado:ALERT_TYPES.ERROR,
                msg: e.message
            })            
        }
    }
    const valueChangeHandler=(key, value)=>{
        setValues((values)=>{
            if (values[key]===value) return values;
            return {
                ...values,
                [key]:value
            }
        })
    }
    const hasChange =
        values.nickname !== member.nickname ||
        values.rank_id !== member.rank_id ||
        values.unit_id !== member.unit_id

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm">

            <div className="w-[90%] max-w-lg bg-dashboard-card rounded-dashboard border border-dashboard-accent shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-center relative px-6 py-4 border-b border-dashboard-border">

                    <div>
                        <h2 className="mb-0! p-0 text-xl">
                            Editar miembro
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Modifica la información del miembro.
                        </p>
                    </div>

                    <button
                        onClick={() => closeModal()}
                        className="
                            text-3xl
                            leading-none
                            text-gray-500
                            hover:text-white
                            transition
                            p-5
                            absolute
                            right-0
                        "
                    >
                        ×
                    </button>

                </div>


                {/* Contenido */}
                <div className="px-6 py-6">

                    <div className="space-y-5">

                        {/* ID */}



                        {/* Nickname */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Nombre / Nickname
                            </label>

                            <input
                                type="text"
                                placeholder="Ingrese el nombre del miembro..."
                                className="w-full"
                                value={values.nickname}
                                onChange={(e)=>{valueChangeHandler('nickname', e.target.value)}}
                            />
                        </div>


                        {/* Rango */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Rango
                            </label>

                            <select value={values.rank_id} className="w-full py-2 bg-dashboard-item rounded-xs"
                            onChange={(e)=>{valueChangeHandler('rank_id', parseInt(e.target.value))}}
                            >
                              <option value="" disabled className="bg-dashboard-item">
                                Seleccione un rango
                              </option>

                              {dashboardData.ranks.map((item) => (
                                <option key={item.id} value={item.id} className="bg-dashboard-item">
                                  {item.name}
                                </option>
                              ))}
                            </select>
                        </div>

                        {/* Unidad */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Unidad
                            </label>

                            <select value={values.unit_id} className="w-full py-2 bg-dashboard-item rounded-xs"
                            onChange={(e)=>{valueChangeHandler('unit_id', parseInt(e.target.value))}}
                            >
                              <option value="" disabled className="bg-dashboard-item">
                                Seleccione un rango
                              </option>
                                
                              {dashboardData.units.map((item) => (
                                <option key={item.id} value={item.id} className="bg-dashboard-item">
                                  {item.name}
                                </option>
                              ))}
                            </select>
                        </div>

                    </div>

                </div>


                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-dashboard-border">

                    <button
                        onClick={() => closeModal()}
                        className="btn-secondary"
                    >
                        Cancelar
                    </button>

                    <button
                        disabled={!hasChange}
                        onClick={() => summitHandler()}
                        className={`
                            btn-primary 
                            
                            ${hasChange ? '':'cursor-not-allowed opacity-35'}`}
                    >
                        Guardar cambios
                    </button>

                </div>

            </div>

        </div>
    );
}
