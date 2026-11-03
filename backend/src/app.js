import express from "express";
import appRoutes from "./routes/app.routes.js";
import eventsRoutes from "./routes/events.routes.js";
import authRoutes from "./auth/auth.routes.js";
import membersRoutes from "./routes/members.routes.js"
import logsRoutes from "./routes/audit_logs.routes.js"
import usersRoutes from "./routes/users.routes.js"
import cors from "cors";
import cookieParser from "cookie-parser";
import { initAdmUser } from "./services/initAdmUser.js";
import { config } from "./config/env.js";

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); // acepta cualquier origin dinámicamente
  },
  credentials: true
}));
//app.use(cors({
//  origin: "http://127.0.0.1:5173", 
//  credentials: true
//}));
if (config.nodeEnv === "development") {
  app.use((req, res, next) => {
    const delay = Math.floor(Math.random() * 2501) + 200;
    setTimeout(next, delay);
  });
}
app.use(express.json());
app.use(cookieParser());
initAdmUser()

app.use("/app", appRoutes);
app.use("/events", eventsRoutes);
app.use("/auth", authRoutes);
app.use("/members", membersRoutes);
app.use("/audit_logs", logsRoutes);
app.use("/users", usersRoutes);
//features
//app.use("/ranks", ranksRoutes);
//app.use("/roles", rolesRoutes);
//app.use("/logs", logsRoutes);
//app.use("/units", unitsRoutes);

//app.use((req, res, next) => {
//  res.status(404).json({ message: "Endpoint not found" });
//});
export default app;