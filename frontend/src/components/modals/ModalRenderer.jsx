import { useModal } from "../../context/ModalContext";
import ConfirmModal from "./ConfirmModal";
import EditMemberModal from "./EditMemberModal";
import InsertFromIA from "./InsertFromIAModal";
import ManageRolesModal from "./ManageRolesModal";
import TestModal from "./ModalTest";
import MyUserModal from "./MyUserModal";
import NewMemberModal from "./NewMemberModal";
import NewUserModal from "./NewUserModal";
import UserPermissionsModal from "./UserPermissionsModal";
import ViewMemberModal from "./viewMemberModal";

// Registro de modales
const modalComponents = {
    'test': TestModal,
    'edit-member': EditMemberModal,
    'new-member': NewMemberModal,
    'insert-Attendace-IA': InsertFromIA,
    'view-member':ViewMemberModal,
    'new-user':NewUserModal,
    'my-user':MyUserModal,
    'confirm':ConfirmModal,
    'user-permissions': UserPermissionsModal,
    'manage-roles':ManageRolesModal,
};
export default function ModalRenderer({children}) {

    const { modalStack } = useModal();


    return (

        <>
        
        {children}
        
        {/* Renderizamos las modales */}
        {modalStack.map((modal, index) => {
        
            const ModalComponent = modalComponents[modal.type];
        
            if (!ModalComponent) {
                console.warn(
                    `No existe una modal registrada para: ${modal.type}`
                );
            
                return null;
            }
        
            return (
                <ModalComponent
                    key={modal.id}
                    {...modal.props}
                />
            );

})}
        </>
    )

}