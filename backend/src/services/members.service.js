import pool from "../db/pool.js";
import { createAuditLog } from "./auditLog.service.js";

const ejemploBody = {} 
    



const allowedFields = {
    nickname: 'nickname',
    rank_id: 'rank_id',
    unit_id:'unit_id',
};

export async function newMember(
    member={
        nickname,
        rank_id,
        unit_id,
    },
    idActor 
) {
    
    const client = await pool.connect();
    try{
        await client.query('BEGIN');
        const query = 'INSERT INTO members(nickname, rank_id, unit_id) VALUES($1, $2, $3) RETURNING *';
        const {rows} = await client.query(query, [member.nickname, member.rank_id, member.unit_id]);
        await createAuditLog(client, {
            actorId: idActor,
            action: "member.create",
            entityType: "member",
            entityId: rows[0].id,
            entityName: rows[0].nickname,
            oldData: null,
            newData: rows[0],
            affectedMembers: [rows[0].id]
        });
        await client.query('COMMIT');
        return rows[0];

    }catch(e){
        await client.query('ROLLBACK');
        console.error(e)
        throw new Error("error al procesar solicitud en service");
        
    }finally {
        client.release();
    }




}

export async function parcialUpdateMember(data, memberId, idActor) {
    const client = await pool.connect();
    const fields = []
    const values = []
    for(const [key, value] of Object.entries(data)){
        if (!allowedFields[key]) continue
        fields.push( `${allowedFields[key]} = $${values.length + 1}`)
        values.push(value)
    }
    values.push(memberId)
    if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
    }
    try{
        await client.query('BEGIN');

        const oldResult = await client.query(
            'SELECT * FROM members WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
            [memberId]
        );

        if (oldResult.rows.length === 0) {
            throw new Error("Miembro no encontrado");
        }

        const oldData = oldResult.rows[0];
        
        const query = `
            UPDATE members
            SET ${fields.join(', ')}
            WHERE id = $${values.length}
            RETURNING *;
        `;
        
        const {rows} = await client.query(query, values);


        
        await createAuditLog(client, {
            actorId:idActor,
            action: "member.edit",
            entityType: "member",
            entityId: memberId,
            entityName: rows[0].nickname,
            oldData: oldData,
            newData: rows[0],
            affectedMembers:[memberId]
        });
        
        
        await client.query('COMMIT');
        return rows[0];


    }catch(e){
        await client.query('ROLLBACK');
        console.error(e)
        throw new Error("error al procesar solicitud en service");
        

        

    }finally {
        client.release();
    }
    
}

export async function deleteMember(memberId, idActor) {
    
    const client = await pool.connect();

    try{
        await client.query('BEGIN');
        
        const query = `
            UPDATE members
            SET deleted_at = NOW()
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING *;
        `;
        
        const {rows} = await client.query(query, [memberId]);
        if (rows.length === 0) {
            throw new Error("Miembro no encontrado o ya eliminado");
        }

        await createAuditLog(client, {
            actorId: idActor,
            action: "member.delete",
            entityType: "member",
            entityId: memberId,
            entityName: rows[0].nickname,
            oldData: null,
            newData: null,
            affectedMembers: [memberId]
        });
        
        await client.query('COMMIT');
        return rows[0];


    }catch(e){
        await client.query('ROLLBACK');
        console.error(e)
        throw new Error("error al procesar solicitud en service");
 

    }finally {
        client.release();
    }

}