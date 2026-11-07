
import {
  newRole,
  updateRole,
  deleteRole,
  RoleServiceError
} from "../services/roles.service.js";

import { User } from "../entities/user.entity.js";

// Comprueba que un ID sea un entero positivo válido.
function parseRoleId(value) {
  const id = Number(value);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

// Validación común para creación y edición.
function validateRoleData(body, partial = false) {
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body)
  ) {
    return "El cuerpo de la solicitud no es válido";
  }

  const allowedFields = ["name", "permissions"];

  if (Object.keys(body).some(key => !allowedFields.includes(key))) {
    return "La solicitud contiene campos no permitidos";
  }

  if (!partial || body.name !== undefined) {
    if (
      typeof body.name !== "string" ||
      !body.name.trim()
    ) {
      return "El nombre del rol es obligatorio";
    }
  }

  if (body.permissions !== undefined) {
    if (
      !Array.isArray(body.permissions) ||
      !body.permissions.every(
        p => typeof p === "string" && p.trim()
      )
    ) {
      return "Los permisos deben ser un arreglo de nombres válidos";
    }
  }

  if (
    partial &&
    body.name === undefined &&
    body.permissions === undefined
  ) {
    return "No hay campos para actualizar";
  }

  return null;
}

// Manejo centralizado de errores.
function handleRoleError(res, error) {
  if (error instanceof RoleServiceError) {
    return res.status(error.status).json({
      ok: false,
      error: error.message
    });
  }

  // Nombre de rol duplicado
  if (error.code === "23505") {
    return res.status(409).json({
      ok: false,
      error: "Ya existe un rol con ese nombre"
    });
  }

  // Rol referenciado por otros registros
  if (error.code === "23503") {
    return res.status(409).json({
      ok: false,
      error: "El rol está siendo utilizado y no se puede eliminar"
    });
  }

  console.error("Error en operación de roles:", error);

  return res.status(500).json({
    ok: false,
    error: "Error interno del servidor"
  });
}

/**
 * POST /roles
 * Crear un nuevo rol.
 */
export async function rolePostController(req, res) {
  /** @type {User | undefined} */
  const user = req.user;

  if (!user?.permissions?.includes("roles.create")) {
    return res.sendStatus(403);
  }

  const validationError = validateRoleData(req.body);

  if (validationError) {
    return res.status(400).json({
      ok: false,
      error: validationError
    });
  }

  try {
    const role = await newRole(
      {
        name: req.body.name.trim(),
        permissions: [
          ...new Set(req.body.permissions ?? [])
        ]
      },
      user.id
    );

    return res.status(201).json({
      ok: true,
      role
    });

  } catch (error) {
    return handleRoleError(res, error);
  }
}

/**
 * PATCH /roles/:id
 * Actualizar parcialmente un rol.
 */
export async function rolePatchController(req, res) {
  /** @type {User | undefined} */
  const user = req.user;

  if (!user?.permissions?.includes("roles.edit")) {
    return res.sendStatus(403);
  }

  const roleId = parseRoleId(req.params.id);

  if (roleId === null) {
    return res.status(400).json({
      ok: false,
      error: "ID de rol inválido"
    });
  }

  const validationError = validateRoleData(
    req.body,
    true
  );

  if (validationError) {
    return res.status(400).json({
      ok: false,
      error: validationError
    });
  }

  try {
    const changes = {};

    if (req.body.name !== undefined) {
      changes.name = req.body.name.trim();
    }

    if (req.body.permissions !== undefined) {
      changes.permissions = [
        ...new Set(req.body.permissions)
      ];
    }

    const role = await updateRole(
      changes,
      roleId,
      user.id
    );

    return res.json({
      ok: true,
      role
    });

  } catch (error) {
    return handleRoleError(res, error);
  }
}

/**
 * DELETE /roles/:id
 * Eliminar un rol.
 */
export async function roleDeleteController(req, res) {
  /** @type {User | undefined} */
  const user = req.user;

  if (!user?.permissions?.includes("roles.delete")) {
    return res.sendStatus(403);
  }

  const roleId = parseRoleId(req.params.id);

  if (roleId === null) {
    return res.status(400).json({
      ok: false,
      error: "ID de rol inválido"
    });
  }

  try {
    const deletedRole = await deleteRole(
      roleId,
      user.id
    );

    return res.json({
      ok: true,
      message: "Rol eliminado correctamente",
      role: deletedRole
    });

  } catch (error) {
    return handleRoleError(res, error);
  }
}
