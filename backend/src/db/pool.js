import pkg from "pg";
import { config } from "../config/env.js";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: config.db.url,
  min: 3,
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

function logPool(evento) {
  console.log(`[DB POOL] ${evento}`, {
    total: pool.totalCount,
    idle: pool.idleCount,
    ocupadas: pool.totalCount - pool.idleCount,
    esperando: pool.waitingCount,
  });
}

// Se creó una nueva conexión física con PostgreSQL
pool.on("connect", () => {
  logPool("Nueva conexión");
});

// Una conexión fue adquirida del pool
pool.on("acquire", () => {
  logPool("Conexión adquirida");
});

// Una conexión fue devuelta al pool
pool.on("release", (error) => {
  logPool(error ? "Conexión liberada con error" : "Conexión liberada");
});

// Una conexión fue eliminada del pool
pool.on("remove", () => {
  logPool("Conexión eliminada");
});

// Error inesperado en una conexión inactiva
pool.on("error", (error) => {
  console.error("[DB POOL] ERROR:", error);
  logPool("Error de conexión");
});

// Estadísticas 
const monitor = setInterval(() => {
  logPool("Estado");
}, 1000*60*60);

monitor.unref();

export default pool;