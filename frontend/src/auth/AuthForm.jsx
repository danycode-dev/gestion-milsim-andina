import { useState } from "react";
import { useUser } from "../context/UserContext";
import { ALERT_TYPES, useAlertGlobal } from "../context/AlertContext";



export default function AuthForm() {
    const { AuthLogin } = useUser();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const { addGlobalAlert } = useAlertGlobal(); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await AuthLogin(username, password);
        }catch(err){

            addGlobalAlert({
                estado:ALERT_TYPES.ERROR,
                msg:`Error: ${err.message}`
            })

        }
    }

    return (
        <div className="w-full max-w-md mx-auto mt-22">

            {/* Header */}
            <div className="text-center mb-8">
                <img src="d1.png" alt="Logo Unidad" className="m-auto h-40" />


                <h2 className="text-2xl font-bold text-white">
                    División Andina
                </h2>

                <p className="mt-2 text-sm text-gray-400">
                    Inicia sesión para continuar
                </p>
            </div>

            {/* Formulario */}
            <form
                onSubmit={handleSubmit}
                className="
                    flex flex-col gap-5
                    p-6
                    rounded-2xl
                    border border-dashboard-border
                    bg-dashboard-card
                    shadow-2xl
                "
            >

                {/* Usuario */}
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="username"
                        className="text-sm font-medium text-gray-300"
                    >
                        Usuario
                    </label>

                    <input
                        type="text"
                        id="username"
                        name="username"
                        autoComplete="username"
                        placeholder="Ingresa tu usuario"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="
                            w-full
                            h-11
                            px-4
                            rounded-lg
                            border border-dashboard-border
                            bg-black/20
                            text-white
                            placeholder:text-gray-500
                            outline-none
                            transition
                            focus:border-dashboard-accent
                            focus:ring-2
                            focus:ring-dashboard-accent/20
                        "
                    />
                </div>

                {/* Contraseña */}
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="password"
                        className="text-sm font-medium text-gray-300"
                    >
                        Contraseña
                    </label>

                    <input
                        type="password"
                        id="password"
                        name="password"
                        autoComplete="current-password"
                        placeholder="Ingresa tu contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="
                            w-full
                            h-11
                            px-4
                            rounded-lg
                            border border-dashboard-border
                            bg-black/20
                            text-white
                            placeholder:text-gray-500
                            outline-none
                            transition
                            focus:border-dashboard-accent
                            focus:ring-2
                            focus:ring-dashboard-accent/20
                        "
                    />
                </div>

                {/* Botón */}
                <button
                    type="submit"
                    style={{ backgroundColor: "var(--accent-color)" }}
                    className="
                        w-full
                        h-11
                        mt-2
                        rounded-lg
                        text-black
                        font-bold
                        transition
                        hover:brightness-110
                        active:scale-[0.98]
                    "
                >
                    Iniciar Sesión
                </button>

            </form>

        </div>
    );
}