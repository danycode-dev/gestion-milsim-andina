// Función adaptada de un proyecto propio anterior y ajustada a este proyecto.

import { useDashboardData } from "../context/DataContext";
import { useModal } from "../context/ModalContext";
import { useUser } from "../context/UserContext";
import { User } from "../entities/user.entity";


function MemberSimple({
	member,
  rank=null,
  className

}) {

	const { dashboardData, unitsById, ranksById } = useDashboardData();
	const {openModal } = useModal();
  console.log(member)
  rank = rank==null ?  ranksById[member.rank_id] : rank 

	/** @type {{ user: User | undefined }} */
	const { user:selfUser } = useUser();

	const openProfile = async(member) => {
		if(!selfUser.hasPermission('members.view')) return
		await openModal('view-member',{
			member
		})
	};



  return (
    <button className={`flex-1 text-left group cursor-pointer min-w-0 ${className}`} onClick={()=>{openProfile(member)}}>
      <div className="
        flex
        items-center
        gap-3
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
        <div  
        className='text-sm font-semibold text-gray-300 truncate
        group-hover:text-(--accent-color) transition cursor-pointer
        group-hover:scale-105
        '
        >
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
              group-hover:border-(--accent-color)
              group-hover:scale-110
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
    </button>
  );
}


export default MemberSimple;