import { User } from "../entities/user.entity.js";
import { deleteMember, newMember, parcialUpdateMember } from "../services/members.service.js";


// crear miembros
export async function memberPost(req, res) {
  /** @type {User | undefined} */
  const user = req.user
  if (!user.permissions.includes('members.create')) return res.sendStatus(403);
  try {
    if (!req.body || !req.body.nickname || !req.body.rank_id || !req.body.unit_id) {
      return res.status(400).json(
        { 
          ok: false, error: "Datos incompletos",
          example: {
            "nickname": "Vicente",
            "rank_id": 5,
            "unit_id":6,
          }
        }
      );
    }
    const data = await newMember({nickname:req.body.nickname, rank_id:req.body.rank_id, unit_id:req.body.unit_id}, user.id);
    res.json({ ok : true, data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "internal error" });
  }
}
// editar miembros
export async function patchMember(req, res){ 
  /** @type {User | undefined} */
  const user = req.user
  if (!user.permissions.includes('members.edit')) return res.sendStatus(403);
  try{


    const { memberId } = req.params;
    if (!memberId) return res.status(400).json({ok:false, error:'falta el memberId'})

    if (!req.body) {
      return res.status(400).json({ ok: false, error: "Body requerido" });
    }

    const val = req.body;
    
    if (!val.nickname && !val.rank_id) {
      return res.status(400).json(
        { 
          ok: false, error: "Datos incompletos del evento tiene que haber porlomenos un parametro a cambiar",
          example: {
            "nickname": "Raul",
            "rank_id": 5,
          }
        }
      );
    }


		// service
    const memberEdit = await parcialUpdateMember(val, memberId, user.id);

    if (!memberEdit) {
      return res.status(404).json({
        ok: false,
        error: 'Miembro no encontrado'
      });
    }

    return res.json({ ok: true });


  }catch(e){
		return res.status(500).json({ ok: false, error: "Error inesperado en api" });
	}

}

export async function deleteMemberController(req, res) {
  /** @type {User | undefined} */
  const user = req.user;

  if (!user.permissions.includes('members.delete')) {
    return res.sendStatus(403);
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