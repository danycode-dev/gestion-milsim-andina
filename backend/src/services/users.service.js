import pool from "../db/pool.js";
import bcrypt from "bcrypt";
import { User } from "../entities/user.entity.js";


/**
 * Crear un nuevo usuario.
 *
 * @returns {Promise<User>}
 */
export async function newUser({
  username,
  password,
  email = null,
  role_id = null,
  active = true,
  all_units = false,
  permissions = [],
  units = []
}) {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await client.query(
      `INSERT INTO users
        (username, email, password_hash, role_id, active, all_units)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        username,
        email,
        passwordHash,
        role_id,
        active,
        all_units
      ]
    );

    const dbUser = result.rows[0];

    // 3. Asignar permisos individuales
    for (const permission of permissions) {
      await client.query(
        `INSERT INTO user_permissions (user_id, permission_id)
         SELECT $1, id
         FROM permissions
         WHERE name = $2`,
        [dbUser.id, permission]
      );
    }

    // 4. Asignar unidades
    for (const unitId of units) {
      await client.query(
        `INSERT INTO user_units (user_id, unit_id)
         VALUES ($1, $2)`,
        [dbUser.id, unitId]
      );
    }

    // 5. Confirmar cambios
    await client.query("COMMIT");

    // 6. Construir entidad User
    return new User({
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      passwordHash: dbUser.password_hash,
      role_id: dbUser.role_id,
      active: dbUser.active,
      all_units: dbUser.all_units,
      permissions,
      units
    });

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}

/**
 * Obtiene usuarios con búsqueda opcional.
 * @returns {Promise<User[]>}
 */
export async function getUsers(search = "") {
  const result = await pool.query(
    `SELECT
        u.id,
        u.username,
        u.email,
        u.role_id,
        u.active,
        u.all_units,
        COALESCE(
          ARRAY_AGG(p.name) FILTER (WHERE p.name IS NOT NULL),
          ARRAY[]::TEXT[]
        ) AS permissions
     FROM users u
     LEFT JOIN role_permissions rp ON rp.role_id = u.role_id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE u.username ILIKE $1 OR u.email ILIKE $1
     GROUP BY u.id
     ORDER BY u.id ASC`,
    [`%${search}%`]
  );

  return result.rows.map(row => new User(row));
}

/**
 * Obtiene un usuario por su ID.
 * @returns {Promise<User | null>}
 */
export async function getUserById(id) {
  const result = await pool.query(
    `SELECT
      id, username, email, role_id, active, all_units
     FROM users
     WHERE id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;

  return new User(result.rows[0]);
}

/**
 * Cambia la contraseña de un usuario.
 *
 * @param {number} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<boolean>}
 */
export async function changeUserPassword(
  userId,
  currentPassword,
  newPassword
) {
  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string"
  ) {
    throw new Error("Contraseñas inválidas");
  }

  if (newPassword.length < 8) {
    throw new Error(
      "La nueva contraseña debe tener al menos 8 caracteres"
    );
  }

  if (Buffer.byteLength(newPassword, "utf8") > 72) {
    throw new Error(
      "La nueva contraseña es demasiado larga"
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // bloquear usario en la bd mientras
    const result = await client.query(
      `SELECT password_hash
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error("Usuario no encontrado");
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!validPassword) {
      throw new Error("La contraseña actual es incorrecta");
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      user.password_hash
    );

    if (samePassword) {
      throw new Error(
        "La nueva contraseña debe ser diferente a la actual"
      );
    }


    const newPasswordHash = await bcrypt.hash(newPassword, 12);

   
    await client.query(
      `UPDATE users
       SET password_hash = $1
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    await client.query("COMMIT");

    return true;

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}



/**
 * Actualiza un usuario.
 * Solo modifica los campos recibidos en changes.
 *
 * @param {Object} changes
 * @param {number} userId
 * @returns {Promise<Object>}
 */
export async function updateUser(changes, userId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const currentUser = await client.query(
      `SELECT id FROM users WHERE id = $1 FOR UPDATE`,
      [userId]
    );

    if (currentUser.rows.length === 0) {
      throw new Error("Usuario no encontrado");
    }

    // Campos modificables directamente
    const allowedFields = [
      "username",
      "email",
      "role_id",
      "active",
      "all_units"
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (changes[field] === undefined) continue;

      values.push(changes[field]);
      updates.push(`${field} = $${values.length}`);
    }

    // Validar que el rol exista
    if (changes.role_id != null &&
        changes.role_id !== undefined) {

      const role = await client.query(
        "SELECT id FROM roles WHERE id = $1",
        [changes.role_id]
      );

      if (role.rows.length === 0) {
        throw new Error("El rol seleccionado no existe");
      }
    }

    // Actualizar campos principales
    if (updates.length > 0) {
      values.push(userId);

      await client.query(
        `UPDATE users
         SET ${updates.join(", ")}
         WHERE id = $${values.length}`,
        values
      );
    }

    // Actualizar permisos individuales
    if (changes.permissions !== undefined) {
      if (!Array.isArray(changes.permissions)) {
        throw new Error("Los permisos deben ser un arreglo");
      }

      const permissions = [...new Set(changes.permissions)];

      const validPermissions = await client.query(
        `SELECT id, name
         FROM permissions
         WHERE name = ANY($1::text[])`,
        [permissions]
      );

      if (validPermissions.rows.length !== permissions.length) {
        throw new Error("Uno o más permisos no existen");
      }

      await client.query(
        "DELETE FROM user_permissions WHERE user_id = $1",
        [userId]
      );

      for (const permission of validPermissions.rows) {
        await client.query(
          `INSERT INTO user_permissions (user_id, permission_id)
           VALUES ($1, $2)`,
          [userId, permission.id]
        );
      }
    }

    // Actualizar unidades
    if (changes.units !== undefined) {
      if (!Array.isArray(changes.units)) {
        throw new Error("Las unidades deben ser un arreglo");
      }

      const units = [...new Set(changes.units)];

      const validUnits = await client.query(
        `SELECT id
         FROM units
         WHERE id = ANY($1::integer[])`,
        [units]
      );

      if (validUnits.rows.length !== units.length) {
        throw new Error("Una o más unidades no existen");
      }

      await client.query(
        "DELETE FROM user_units WHERE user_id = $1",
        [userId]
      );

      for (const unit of validUnits.rows) {
        await client.query(
          `INSERT INTO user_units (user_id, unit_id)
           VALUES ($1, $2)`,
          [userId, unit.id]
        );
      }
    }

    // Obtener usuario actualizado
    const result = await client.query(
      `SELECT id, username, email, role_id, active, all_units
       FROM users
       WHERE id = $1`,
      [userId]
    );

    await client.query("COMMIT");

    return result.rows[0];

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}




/**
 * Desactiva un usuario sin eliminarlo de la BD.
 *
 * @param {number} userId
 * @returns {Promise<Object>}
 */
export async function deactivateUser(userId) {
  const result = await pool.query(
    `UPDATE users
     SET active = FALSE
     WHERE id = $1
     RETURNING id, username, email, role_id, active, all_units`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error("Usuario no encontrado");
  }

  return result.rows[0];
}
