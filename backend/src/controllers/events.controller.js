import { getAttendanceByEventId, newEvent, parcialUpdateEvent } from "../services/events.service.js";



export async function raizPost(req, res) {

  try {
    if (!req.body || !req.body.name || !req.body.date || !req.body.attendance) {
      return res.status(400).json(
        { 
          ok: false, error: "Datos incompletos del evento",
          example: {
            "name": "Evento de prueba",
            "description": "Descripción del evento de prueba",
            "date": "2024-07-01T18:00:00.000Z",
            "attendance": {
                "1": { "estado": "P", "comentario": "" },
                "2": { "estado": "A", "comentario": "" },
                "3": { "estado": "J", "comentario": "justificacion" }
            },
            "type_id": 1
          }
        }
      );
    }

    const data = await newEvent(req.body, req.user);
    res.json({ ok : true, data });


  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "internal error" });
  }
}

export async function getAttendance(req, res) {
  try {
    // pass
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({ ok: false, error: "Falta el ID del evento" });
    }
    const data = await getAttendanceByEventId(eventId);
    res.json({ ok: true, data: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "internal error" });
  }

}


export async function patchEvent(req, res){
  try{


    const { eventId } = req.params;
    if (!eventId) return res.status(400).json({ok:false, error:'falta el eventId'})

    if (!req.body) {
      return res.status(400).json({ ok: false, error: "Body requerido" });
    }

    const { name, description, date, attendance, type_id } = req.body;

    if (!name && !description && !date && !attendance && !type_id) {
      return res.status(400).json(
        { 
          ok: false, error: "Datos incompletos del evento tiene que haber porlomenos un parametro a cambiar",
          example: {
            "name": "Evento de prueba",
            "description": "Descripción del evento de prueba",
            "date": "2024-07-01T18:00:00.000Z",
            "attendance": {
                "1": { "estado": "P", "comentario": "" },
                "2": { "estado": "A", "comentario": "" },
                "3": { "estado": "J", "comentario": "justificacion" }
            },
            "type_id": 1
          }
        }
      );
    }


		// service
		const ok = parcialUpdateEvent({name, description, date, attendance, type_id}, eventId, req.user)
		if (ok){
    	res.json({ ok : true });

		}


  }catch(e){
		return res.status(500).json({ ok: false, error: "Error inesperado en api" });
	}


}