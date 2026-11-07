
import { useState } from "react";
import { useDashboardData } from "../../context/DataContext";
import { useModal } from "../../context/ModalContext";
import { User } from "../../entities/user.entity";
import { useUser } from "../../context/UserContext";
import { countryFlags, countryNames } from "../../utils/countries";

export default function ViewMemberModal({

    member = {
        id:null, 
        nickname: "",
        rank_id: ""
    }
}
) {
    const {ranksById, dashboardData, isLoading, error, reloadData, membersById, unitsById } = useDashboardData();
    member = membersById[member.id] ?? member;

    const currentMember = membersById[member.id] ?? member;
    
     console.log(currentMember)
    const { closeModal, openModal } = useModal();

    /** @type {{ user: User | undefined }} */
    const { user:selfUser } = useUser();

    const summitHandler = async ()=>{
        openModal('edit-member',{member: currentMember})
            

    }
    const unit = unitsById[currentMember.unit_id];

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm">

            <div className="w-[90%] max-w-lg bg-dashboard-card rounded-dashboard border border-dashboard-accent shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-center relative px-6 py-4 border-b border-dashboard-border">

                    <div>
                        <h2 className="mb-0! p-0 text-xl">
                            Ver Miembro
                        </h2>
                        {
                        //    <p className="text-sm text-gray-500 mt-1">
                        //    Modifica la información del miembro.
                        //    </p>
                        }
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
                <div className="px-6 py-7">
                    <div className="space-y-6">
                                    
                        {/* ICON */}
                        <div className="flex justify-center">
                            <span className="
                                flex items-center justify-center
                                w-16 h-16
                                rounded-full
                                bg-[#454545]
                                border border-dashboard-accent/50
                                text-dashboard-accent
                                text-2xl font-semibold
                                uppercase
                            ">
                                {currentMember.nickname?.[0] ?? "?"}
                            </span>
                        </div>
                                    
                        {/* Información */}
                        <div className="space-y-3">
                                    
                            {/* ID */}
                            <div className="
                                flex items-center justify-between
                                px-4 py-3
                                rounded-lg
                                bg-dashboard-border/20
                                border border-dashboard-border
                            ">
                                <span className="text-sm text-gray-400">
                                    ID
                                </span>
                                    
                                <span className="text-sm font-medium text-gray-200">
                                    {currentMember.id}
                                </span>
                            </div>
                                    
                            {/* Nickname */}
                            <div className="
                                flex items-center justify-between
                                px-4 py-3
                                rounded-lg
                                bg-dashboard-border/20
                                border border-dashboard-border
                            ">
                                <span className="text-sm text-gray-400">
                                    Nickname
                                </span>
                                    
                                <span className="text-sm font-medium text-gray-200">
                                    {currentMember.nickname}
                                </span>
                            </div>
                                    
                            {/* Rango */}
                            <div className="
                                flex items-center justify-between
                                px-4 py-3
                                rounded-lg
                                bg-dashboard-border/20
                                border border-dashboard-border
                            ">
                                <span className="text-sm text-gray-400">
                                    Rango
                                </span>
                                    
                                <span className="text-sm font-medium text-gray-200">
                                    {ranksById[currentMember.rank_id].name}
                                </span>
                            </div>

                            {/* unit */}
                            <div className="
                                flex items-center justify-between
                                px-4 py-3
                                rounded-lg
                                bg-dashboard-border/20
                                border border-dashboard-border
                            ">
                                <span className="text-sm text-gray-400">
                                    Unidad
                                </span>
                                    
                                <span className="text-sm font-medium text-gray-200 flex gap-2 items-center">
                                    {!unit ? (
                                            "Unidad no encontrada"
                                        ) : (
                                            <>
                                                {unit.name}
                                                {unit.logo_url? <img className="h-6 w-6" src={`${unit.logo_url}`} alt="" />:''}
                                                
                                            </>
                                    )}

                                </span>
                            </div> 
                            {/* Fecha de ingreso */}
                            <div className="
                                flex items-center justify-between
                                px-4 py-3
                                rounded-lg
                                bg-dashboard-border/20
                                border border-dashboard-border
                            ">
                                <span className="text-sm text-gray-400">
                                    Fecha de ingreso
                                </span>
                                    
                                <span className="text-sm font-medium text-gray-200 flex gap-2 items-center">
                                    {member.join_date
                                        ? new Date(
                                            `${member.join_date.slice(0, 10)}T00:00:00`
                                          ).toLocaleDateString("es-CL")
                                        : "Fecha de ingreso no disponible"
                                    }
                                </span>
                            </div>   

                            {/* Nacionalidad */}
                            <div className="
                                flex items-center justify-between
                                px-4 py-3
                                rounded-lg
                                bg-dashboard-border/20
                                border border-dashboard-border
                            ">
                                <span className="text-sm text-gray-400">
                                    Nacionalidad
                                </span>
                                    
                                <span className="text-sm font-medium text-gray-200 flex gap-2 items-center">
                                        {countryNames[member.nationality_code] || member.nationality_code || 'Nacionalidad no disponible'}
                                        {countryFlags[member.nationality_code] ? <span>{countryFlags[member.nationality_code]}</span>:null}
                                                
                                </span>
                            </div>  
                        </div>
                                    
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-dashboard-border">

                    <button
                        onClick={() => closeModal()}
                        className="btn-secondary"
                    >
                        Cerrar
                    </button>

                    <button 
                        disabled={!selfUser.hasPermission('members.edit')}
                        onClick={() => summitHandler()}
                        className={`
                            btn-primary 
                            
                            ${selfUser.hasPermission('members.edit') ? '':'cursor-not-allowed opacity-35'}`}
                    >
                        Editar Miembro
                    </button>

                </div>

            </div>

        </div>
    );
}
