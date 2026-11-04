import { User } from "../entities/user.entity.js";
import { deleteMember, newMember, parcialUpdateMember } from "../services/members.service.js";
import { isValidJoinDate, isValidNationalityCode } from "../utils/validators.js";


// crear miembros
export async function memberPost(req, res) {
  /** @type {User | undefined} */
  const user = req.user
  if (!user.permissions.includes('members.create')) {
    return res.status(403).json({
      ok: false,
      error: "No tienes permiso para realizar esta acción."
    });
  }

  try {
    const {
      nickname,
      rank_id,
      unit_id,
      join_date = null,
      nationality_code = null
    } = req.body ?? {};

    if (!nickname || !rank_id || !unit_id) {
      return res.status(400).json({
        ok: false,
        error: "Datos incompletos",
        example: {
          nickname: "Vicente",
          rank_id: "4",
          unit_id: "2",
          join_date: "2026-11-03",
          nationality_code: "CL"
        }
      });
    }

    if (!isValidJoinDate(join_date)) {
      return res.status(400).json({
        ok: false,
        error: "join_date debe ser una fecha válida con formato YYYY-MM-DD"
      });
    }

    if (!isValidNationalityCode(nationality_code)) {
      return res.status(400).json({
        ok: false,
        error: "nationality_code debe contener dos letras mayúsculas, por ejemplo CL"
      });
    }

    const data = await newMember({
      nickname,
      rank_id,
      unit_id,
      join_date,
      nationality_code
    }, user.id);

    return res.json({ ok: true, data });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "internal error" });
  }
}
// editar miembros
export async function patchMember(req, res){ 
  /** @type {User | undefined} */
  const user = req.user
  if (!user.permissions.includes('members.edit')) {
    return res.status(403).json({
      ok: false,
      error: "No tienes permiso para realizar esta acción."
    });
  }
  try {
    const { memberId } = req.params;
    if (!memberId) {
      return res.status(400).json({
        ok: false,
        error: "Falta el memberId"
      });
    }

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        ok: false,
        error: "Body requerido"
      });
    }

    const val = req.body;
    const allowedFields = [
      "nickname",
      "rank_id",
      "unit_id",
      "join_date",
      "nationality_code"
    ];
    const hasChanges = allowedFields.some(field =>
      Object.hasOwn(val, field)
    );
    if (!hasChanges) {
      return res.status(400).json({
        ok: false, error: "Debe proporcionar al menos un campo para actualizar",
        example: {
          nickname: "Raul",
          rank_id: "4",
          unit_id: "1",
          join_date: "2026-11-03",
          nationality_code: "CL"
        }
      });
    }

    if (
      Object.hasOwn(val, "join_date") &&
      !isValidJoinDate(val.join_date)
    ) {
      return res.status(400).json({
        ok: false,
        error: "join_date debe ser una fecha válida con formato YYYY-MM-DD"
      });
    }

    if (
      Object.hasOwn(val, "nationality_code") &&
      !isValidNationalityCode(val.nationality_code)
    ) {
      return res.status(400).json({
        ok: false,
        error: "nationality_code debe contener dos letras mayúsculas, por ejemplo CL"
      });
    }

    // Filtrar campos permitidos
    const changes = Object.fromEntries(
      Object.entries(val).filter(([key]) =>
        allowedFields.includes(key)
      )
    );

    // Service
    const memberEdit = await parcialUpdateMember(
      changes,
      memberId,
      user.id
    );

    if (!memberEdit) {
      return res.status(404).json({
        ok: false,
        error: "Miembro no encontrado"
      });
    }

    return res.json({ ok: true });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      ok: false,
      error: "Error inesperado en api"
    });
  }
}

export async function deleteMemberController(req, res) {
  /** @type {User | undefined} */
  const user = req.user;

  if (!user.permissions.includes('members.delete')) {
    return res.status(403).json({ ok: false, error: "No tienes permiso para realizar esta acción." });
  }

  try {
    const { memberId } = req.params;

    if (!memberId) {
      return res.status(400).json({
        ok: false,
        error: 'Falta el memberId'
      });
    }

    const memberDelete = await deleteMember(memberId, user.id);

    if (!memberDelete) {
      return res.status(404).json({
        ok: false,
        error: 'El miembro no existe o ya fue eliminado'
      });
    }

    return res.json({
      ok: true,
      data: memberDelete
    });

  } catch (e) {
    console.error(e);

    return res.status(500).json({
      ok: false,
      error: 'Error inesperado en API'
    });
  }
}