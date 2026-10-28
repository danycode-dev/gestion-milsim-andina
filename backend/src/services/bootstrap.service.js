import pool from "../db/pool.js";

export async function getBootstrap() {
    const client = await pool.connect();
    try {
        const [members, ranks, events, units, eventTypes, memberTypeStats, roles, permissions] = await Promise.all([
            client.query(`
                SELECT 
                    m.id, 
                    m.nickname, 
                    m.rank_id,
                    m.unit_id,
                    m.join_date,
                    s.consecutive_absences,
                    s.events_attended,
                    s.total_present,
                    s.total_absences,
                    s.total_justified
                FROM members m
                LEFT JOIN events_member_stats s
                ON s.member_id = m.id
                WHERE m.deleted_at IS NULL;
                
            `),
            client.query("SELECT id, rank_name, display_order, short_name, plural_name FROM ranks ORDER BY display_order ASC;"),
            client.query("SELECT id, name, event_date, type_id FROM events"),
            client.query("SELECT id, name, short_name, logo_url FROM units"),
            client.query(`SELECT id, name FROM event_types;`),
            client.query(`SELECT member_id, event_type_id, total_present, total_absences, total_justified FROM events_member_type_stats;`),
            client.query(`
                SELECT 
                    roles.id, 
                    roles.name,
                    COALESCE(
                        ARRAY_AGG(p.name) FILTER (WHERE p.name IS NOT NULL),
                        ARRAY[]::TEXT[]
                    ) AS permissions
                FROM roles
                LEFT JOIN role_permissions rp 
                    ON rp.role_id = roles.id
                LEFT JOIN permissions p 
                    ON p.id = rp.permission_id
                GROUP BY roles.id;
            `),
            client.query(`SELECT id, name FROM permissions;`),
        ]);
        
        const rankMap = {};
        for (const rank of ranks.rows) {
            rankMap[rank.id] = rank.rank_name;
        }
        // preparar ranks
        const ranksFormat = []
        for (const rank of ranks.rows) {
            ranksFormat.push({
                id:rank.id, 
                name:rank.rank_name, 
                display_order:rank.display_order,
                short_name:rank.short_name,
                plural_name:rank.plural_name,
            });
        }
        const unitsFormat=[]
        for (const unit of units.rows) {
            unitsFormat.push({
                id:unit.id, 
                name:unit.name, 
                short_name:unit.short_name,
                logo_url:unit.logo_url,
            });
        }
        const typeStatsMap = {};

        for (const stat of memberTypeStats.rows) {
            if (!typeStatsMap[stat.member_id]) {
                typeStatsMap[stat.member_id] = {};
            }
        
            typeStatsMap[stat.member_id][stat.event_type_id] = {
                total_present: stat.total_present,
                total_absences: stat.total_absences,
                total_justified: stat.total_justified
            };
        }

        const formatMembers=[]
        for (const member of members.rows){  
            const stats={
                consecutive_absences:member.consecutive_absences,
                events_attended:member.events_attended,
                total_present:member.total_present,
                total_absences:member.total_absences,
                total_justified:member.total_justified

            }
            const newMember ={
                id: member.id,
                nickname:member.nickname,
                rank_id:member.rank_id,
                rank_name: rankMap[member.rank_id] || "Unknown",  //  quitar esto despues
                join_date:member.join_date,
                unit_id:member.unit_id,
                stats:stats,
                type_stats: typeStatsMap[member.id] || {}
            }
            formatMembers.push(newMember)
        }
        const membersForRank = {}
        for (const member of formatMembers) {
            if (!membersForRank[member.rank_id]) {
                membersForRank[member.rank_id] = [];
            }
            membersForRank[member.rank_id].push(member);
        }

        return {
            ranks: ranksFormat,
            membersForRank: membersForRank,
            events: events.rows,
            members: formatMembers,
            units: unitsFormat,
            event_types: eventTypes.rows,
            roles:roles.rows,
            permissions:permissions.rows,
        };
    } finally {
        client.release();
    }
}
