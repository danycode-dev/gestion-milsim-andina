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
