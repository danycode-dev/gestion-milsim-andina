
import pool from "../db/pool.js";
import { createAuditLog } from "./auditLog.service.js";

// Error controlado para operaciones de roles
export class RoleServiceError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "RoleServiceError";
    this.status = status;
  }
}

// Comprueba que todos los permisos existen.
// Devuelve sus IDs para utilizarlos en role_permissions.
async function validatePermissions(client, permissions) {
  const uniquePermissions = [...new Set(permissions)];

  if (uniquePermissions.length === 0) {
    return [];
  }

  const { rows } = await client.query(
    `SELECT id, name
     FROM permissions
     WHERE name = ANY($1::text[])`,
    [uniquePermissions]
  );

  if (rows.length !== uniquePermissions.length) {
    throw new RoleServiceError(
      "Uno o más permisos no existen"
    );
  }

  return rows;
}

// Obtiene un rol con sus permisos.
// Se utiliza también para crear los snapshots de auditoría.
async function getRoleSnapshot(client, roleId) {
  const { rows } = await client.query(
    `SELECT
       r.id,
       r.name,
       COALESCE(
         (
           SELECT ARRAY_AGG(p.name ORDER BY p.name)
           FROM role_permissions rp
           JOIN permissions p ON p.id = rp.permission_id
           WHERE rp.role_id = r.id
         ),
         ARRAY[]::text[]
       ) AS permissions
     FROM roles r
     WHERE r.id = $1`,
    [roleId]
  );

  return rows[0] ?? null;
}

// Asigna exactamente los permisos solicitados.
// Esta función debe llamarse dentro de una transacción.
async function replaceRolePermissions(client, roleId, permissions) {
  const validPermissions = await validatePermissions(
    client,
    permissions
  );

  await client.query(
    `DELETE FROM role_permissions
     WHERE role_id = $1`,
    [roleId]
  );

  for (const permission of validPermissions) {
    await client.query(
      `INSERT INTO role_permissions
         (role_id, permission_id)
       VALUES ($1, $2)`,
      [roleId, permission.id]
    );
  }
}

/**
 * Crea un rol y asigna sus permisos.
 *
 * @param {{name: string, permissions: string[]}} data
 * @param {number} actorId
 */
export async function newRole(data, actorId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO roles (name)
       VALUES ($1)
       RETURNING id`,
      [data.name]
    );

    const roleId = rows[0].id;

    await replaceRolePermissions(
      client,
      roleId,
      data.permissions
    );

    const newData = await getRoleSnapshot(client, roleId);

    await createAuditLog(client, {
      actorId,
      action: "role.create",
      entityType: "role",
      entityId: roleId,
      entityName: newData.name,
      oldData: null,
      newData,
      affectedMembers: []
    });

    await client.query("COMMIT");

    return newData;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}

/**
 * Actualiza parcialmente un rol.
 * Solo modifica los campos recibidos.
 *
 * @param {{name?: string, permissions?: string[]}} changes
 * @param {number} roleId
 * @param {number} actorId
 */
export async function updateRole(changes, roleId, actorId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Bloqueamos el rol durante la modificación.
    const current = await client.query(
      `SELECT id
       FROM roles
       WHERE id = $1
       FOR UPDATE`,
      [roleId]
    );

    if (current.rows.length === 0) {
      throw new RoleServiceError(
        "Rol no encontrado",
        404
      );
    }

    const oldData = await getRoleSnapshot(client, roleId);

    // Actualizar nombre solo si fue recibido
    if (changes.name !== undefined) {
      await client.query(
        `UPDATE roles
         SET name = $1
         WHERE id = $2`,
        [changes.name, roleId]
      );
    }

    // Actualizar permisos solo si fueron recibidos
    if (changes.permissions !== undefined) {
      await replaceRolePermissions(
        client,
        roleId,
        changes.permissions
      );
    }

    const newData = await getRoleSnapshot(client, roleId);

    await createAuditLog(client, {
      actorId,
      action: "role.edit",
      entityType: "role",
      entityId: roleId,
      entityName: newData.name,
      oldData,
      newData,
      affectedMembers: []
    });

    await client.query("COMMIT");

    return newData;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}

/**
 * Elimina permanentemente un rol.
 * Impide eliminar roles asignados a usuarios.
 *
 * @param {number} roleId
 * @param {number} actorId
 */
export async function deleteRole(roleId, actorId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const current = await client.query(
      `SELECT id
       FROM roles
       WHERE id = $1
       FOR UPDATE`,
      [roleId]
    );

    if (current.rows.length === 0) {
      throw new RoleServiceError(
        "Rol no encontrado",
        404
      );
    }

    const oldData = await getRoleSnapshot(client, roleId);

    // No eliminar un rol asignado a algún usuario
    const assignedUsers = await client.query(
      `SELECT 1
       FROM users
       WHERE role_id = $1
       LIMIT 1`,
      [roleId]
    );

    if (assignedUsers.rows.length > 0) {
      throw new RoleServiceError(
        "No puedes eliminar un rol que está asignado a usuarios",
        409
      );
    }

    // role_permissions se elimina automáticamente
    // gracias a ON DELETE CASCADE.
    await client.query(
      `DELETE FROM roles
       WHERE id = $1`,
      [roleId]
    );

    await createAuditLog(client, {
      actorId,
      action: "role.delete",
      entityType: "role",
      entityId: roleId,
      entityName: oldData.name,
      oldData,
      newData: null,
      affectedMembers: []
    });

    await client.query("COMMIT");

    return oldData;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}
