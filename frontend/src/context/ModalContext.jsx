
import { createContext, useContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";
const ModalContext = createContext(null);



export function ModalProvider({ children }) {

    const [modalStack, setModalStack] = useState([]);


    const openModal = (type, props = {}) => {

        return new Promise((resolve) => {

            setModalStack((currentStack) => [
                ...currentStack,
                {
                    id: uuidv4(),
                    type,
                    props,
                    resolve
                }
            ]);

        });
    };


    const closeModal = (result) => {

        setModalStack((currentStack) => {

            if (currentStack.length === 0) {
                return currentStack;
            }

            const currentModal = currentStack[currentStack.length - 1];

            currentModal.resolve(result);

            return currentStack.slice(0, -1);

        });

    };


    const closeAllModals = () => {

        setModalStack((currentStack) => {

            currentStack.forEach((modal) => {
                modal.resolve(null);
            });

            return [];

        });

    };


    return (
        <ModalContext.Provider
            value={{
                openModal,
                closeModal,
                closeAllModals, 
                modalStack
            }}
        >

            {children}


        </ModalContext.Provider>
    );
}


export function useModal() {

    const context = useContext(ModalContext);

    if (!context) {
        throw new Error(
            "useModal debe utilizarse dentro de un ModalProvider"
        );
    }

    return context;
}
