CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- permisos para roles
CREATE TABLE role_permissions (
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    password_hash TEXT NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    all_units BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE
);
-- permisos para usuarios individuales
CREATE TABLE user_permissions (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, permission_id)
);
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,

    actor_id INTEGER REFERENCES users(id)
        ON DELETE SET NULL,

    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,

    entity_name TEXT,

    old_data JSONB,
    new_data JSONB,
    affected_members INTEGER[] NOT NULL DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_created
ON audit_logs (created_at DESC, id DESC);

CREATE INDEX idx_audit_logs_actor
ON audit_logs (actor_id);

CREATE TABLE ranks(
    id SERIAL PRIMARY KEY,
    rank_name TEXT NOT NULL,
    display_order INTEGER NOT NULL UNIQUE,
    short_name text NOT NULL,
    plural_name text NOT NULL
);
CREATE TABLE units(
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT
);
CREATE TABLE user_units (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, unit_id)
);

CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    nickname TEXT NOT NULL,
    rank_id INTEGER,
    unit_id INTEGER,
    join_date DATE,
    nationality_code TEXT DEFAULT NULL    --ISO 3166-1 alpha-2 code, ejemplo: 'US', 'ES', 'FR', etc.
    CHECK (nationality_code ~ '^[A-Z]{2}$'),
    birth_date DATE,
    deleted_at TIMESTAMP DEFAULT NULL,

    FOREIGN KEY (rank_id)
        REFERENCES ranks(id)
        ON DELETE SET NULL,

    FOREIGN KEY (unit_id)
      REFERENCES units(id)
      ON DELETE SET NULL
);

-- tabla para definir tipos de misiones(entrenamientos, misiones etc)
CREATE TABLE event_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    counts_for_general_stats BOOLEAN NOT NULL DEFAULT TRUE
);
INSERT INTO event_types (name)
VALUES
    ('Mision'),
    ('Entrenamiento'),
    ('Liberation'),
    ('Otro');



CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    event_date DATE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type_id INTEGER,
    counts_for_general_stats BOOLEAN DEFAULT NULL,
    locked_at TIMESTAMPTZ DEFAULT NULL, -- para congelar un evento (es decir  no sew pueda  volver a editar su attendace)
    consolidated_at TIMESTAMPTZ DEFAULT NULL, -- se usara para futuras  tablas, indica que el evento se encuentra consolidado en el historico

    FOREIGN KEY (type_id)
        REFERENCES event_types(id)
        ON DELETE RESTRICT
);

CREATE TYPE attendance_status AS ENUM (
    'present',
    'absent',
    'justified'
);

CREATE TABLE event_attendance (
    event_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    status attendance_status NOT NULL,
    justification TEXT,

    PRIMARY KEY (event_id, member_id),

    FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (member_id)
        REFERENCES members(id)
        ON DELETE CASCADE
);

CREATE TABLE events_member_stats(
    member_id INTEGER PRIMARY KEY,
    consecutive_absences INTEGER DEFAULT 0,
    events_attended INTEGER DEFAULT 0, -- NOTA:  ESTA COL NO SE PARA QUE FUE CREADA, CREO QUE ACTUALMENTE NO TIENE USO, REVISAR Y ELIMINAR EN EL CASO DE 
    total_present INTEGER DEFAULT 0,
    total_absences INTEGER DEFAULT 0,
    total_justified INTEGER DEFAULT 0,

    FOREIGN KEY (member_id)
        REFERENCES members(id)
        ON DELETE CASCADE

);

CREATE TABLE events_member_type_stats (
    member_id INTEGER NOT NULL,
    event_type_id INTEGER NOT NULL,

    total_present INTEGER NOT NULL DEFAULT 0,
    total_absences INTEGER NOT NULL DEFAULT 0,
    total_justified INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (member_id, event_type_id),

    FOREIGN KEY (member_id)
        REFERENCES members(id)
        ON DELETE CASCADE,

    FOREIGN KEY (event_type_id)
        REFERENCES event_types(id)
        ON DELETE CASCADE
);







-- ============================================================
-- ESTADISTICAS GENERALES DE MIEMBROS
-- ============================================================
-- Solo cuentan los eventos habilitados para estadisticas generales.
--
-- Prioridad:
-- 1. Configuracion individual del evento.
-- 2. Configuracion del tipo de evento.
-- 3. TRUE por defecto si el evento no tiene tipo.
--
-- Las estadisticas por tipo de evento son independientes.
-- ============================================================


-- ------------------------------------------------------------
-- FUNCION: refresh_consecutive_absences
-- ------------------------------------------------------------
-- Recalcula las ausencias consecutivas de un miembro.
--
-- Considera:
-- - Solo eventos que cuentan para estadisticas generales.
-- - Orden cronologico descendente (fecha e ID).
-- - 'present' rompe la racha.
-- - 'absent' aumenta la racha.
-- - 'justified' se ignora, sin aumentar ni romper la racha.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION refresh_consecutive_absences(
    p_member_id INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_consecutive INTEGER;
BEGIN

    SELECT COUNT(*)
    INTO v_consecutive
    FROM (
        SELECT
            ea.status,
            COUNT(*) FILTER (
                WHERE ea.status = 'present'
            ) OVER (
                ORDER BY e.event_date DESC, e.id DESC
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS present_count

        FROM event_attendance ea
        JOIN events e ON e.id = ea.event_id
        LEFT JOIN event_types et ON et.id = e.type_id

        WHERE ea.member_id = p_member_id
          AND ea.status IN ('present', 'absent')
          AND COALESCE(
              e.counts_for_general_stats,
              et.counts_for_general_stats,
              TRUE
          )
    ) AS history

    WHERE status = 'absent'
      AND present_count = 0;

    UPDATE events_member_stats
    SET consecutive_absences = v_consecutive
    WHERE member_id = p_member_id;

END;
$$ LANGUAGE plpgsql;


-- ------------------------------------------------------------
-- FUNCION: refresh_member_general_stats
-- ------------------------------------------------------------
-- Recalcula completamente las estadisticas generales de un miembro.
--
-- Considera exclusivamente eventos habilitados para el general.
--
-- Actualiza:
-- - total_present
-- - total_absences
-- - total_justified
-- - consecutive_absences
--
-- Se utiliza cuando:
-- - Se modifica una asistencia.
-- - Cambia la configuracion de un evento.
-- - Cambia la configuracion de un tipo de evento.
--
-- No modifica events_attended.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION refresh_member_general_stats(
    p_member_id INTEGER
)
RETURNS VOID AS $$
BEGIN

    UPDATE events_member_stats
    SET
        total_present = (
            SELECT COUNT(*)
            FROM event_attendance ea
            JOIN events e ON e.id = ea.event_id
            LEFT JOIN event_types et ON et.id = e.type_id

            WHERE ea.member_id = p_member_id
              AND ea.status = 'present'
              AND COALESCE(
                  e.counts_for_general_stats,
                  et.counts_for_general_stats,
                  TRUE
              )
        ),

        total_absences = (
            SELECT COUNT(*)
            FROM event_attendance ea
            JOIN events e ON e.id = ea.event_id
            LEFT JOIN event_types et ON et.id = e.type_id

            WHERE ea.member_id = p_member_id
              AND ea.status = 'absent'
              AND COALESCE(
                  e.counts_for_general_stats,
                  et.counts_for_general_stats,
                  TRUE
              )
        ),

        total_justified = (
            SELECT COUNT(*)
            FROM event_attendance ea
            JOIN events e ON e.id = ea.event_id
            LEFT JOIN event_types et ON et.id = e.type_id

            WHERE ea.member_id = p_member_id
              AND ea.status = 'justified'
              AND COALESCE(
                  e.counts_for_general_stats,
                  et.counts_for_general_stats,
                  TRUE
              )
        )

    WHERE member_id = p_member_id;

    PERFORM refresh_consecutive_absences(p_member_id);

END;
$$ LANGUAGE plpgsql;


-- ------------------------------------------------------------
-- FUNCION: stats_after_insert
-- ------------------------------------------------------------
-- Se ejecuta al registrar una nueva asistencia.
--
-- Si el evento cuenta para las estadisticas generales:
-- - Suma 1 al contador correspondiente.
-- - Recalcula las ausencias consecutivas.
--
-- Si el evento esta excluido, no modifica las estadisticas.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION stats_after_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_counts BOOLEAN;
BEGIN

    SELECT COALESCE(
        e.counts_for_general_stats,
        et.counts_for_general_stats,
        TRUE
    )
    INTO v_counts
    FROM events e
    LEFT JOIN event_types et ON et.id = e.type_id
    WHERE e.id = NEW.event_id;

    IF v_counts THEN

        UPDATE events_member_stats
        SET
            total_present = total_present + (NEW.status = 'present')::int,
            total_absences = total_absences + (NEW.status = 'absent')::int,
            total_justified = total_justified + (NEW.status = 'justified')::int
        WHERE member_id = NEW.member_id;

        PERFORM refresh_consecutive_absences(NEW.member_id);

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_stats_insert
AFTER INSERT ON event_attendance
FOR EACH ROW
EXECUTE FUNCTION stats_after_insert();


-- ------------------------------------------------------------
-- FUNCION: stats_after_update
-- ------------------------------------------------------------
-- Se ejecuta cuando se modifica una asistencia existente.
--
-- Recalcula las estadisticas generales del miembro utilizando
-- refresh_member_general_stats.
--
-- Asi se consideran correctamente los eventos excluidos.
--
-- Se asume que member_id y event_id no se modifican.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION stats_after_update()
RETURNS TRIGGER AS $$
BEGIN

    IF OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM refresh_member_general_stats(NEW.member_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_stats_update
AFTER UPDATE ON event_attendance
FOR EACH ROW
EXECUTE FUNCTION stats_after_update();


-- ------------------------------------------------------------
-- FUNCION: create_member_stats
-- ------------------------------------------------------------
-- Se ejecuta cuando se crea un miembro.
--
-- Crea automaticamente su fila de estadisticas generales
-- con los contadores inicializados en cero.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION create_member_stats()
RETURNS TRIGGER AS $$
BEGIN

    INSERT INTO events_member_stats (member_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_create_member_stats
AFTER INSERT ON members
FOR EACH ROW
EXECUTE FUNCTION create_member_stats();


-- ------------------------------------------------------------
-- FUNCION: stats_after_delete
-- ------------------------------------------------------------
-- Se ejecuta cuando se elimina una asistencia.
--
-- Si el evento cuenta para las estadisticas generales:
-- - Resta 1 del contador correspondiente.
-- - Recalcula las ausencias consecutivas.
--
-- Si el evento esta excluido, no modifica las estadisticas.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION stats_after_delete()
RETURNS TRIGGER AS $$
DECLARE
    v_counts BOOLEAN;
BEGIN

    SELECT COALESCE(
        e.counts_for_general_stats,
        et.counts_for_general_stats,
        TRUE
    )
    INTO v_counts
    FROM events e
    LEFT JOIN event_types et ON et.id = e.type_id
    WHERE e.id = OLD.event_id;

    IF v_counts THEN

        UPDATE events_member_stats
        SET
            total_present = total_present - (OLD.status = 'present')::int,
            total_absences = total_absences - (OLD.status = 'absent')::int,
            total_justified = total_justified - (OLD.status = 'justified')::int
        WHERE member_id = OLD.member_id;

        PERFORM refresh_consecutive_absences(OLD.member_id);

    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_stats_delete
AFTER DELETE ON event_attendance
FOR EACH ROW
EXECUTE FUNCTION stats_after_delete();


-- ------------------------------------------------------------
-- FUNCION: sync_stats_on_event_date_change
-- ------------------------------------------------------------
-- Se ejecuta cuando cambia la fecha de un evento.
--
-- Recalcula las ausencias consecutivas de los miembros
-- registrados en ese evento.
--
-- No recalcula los totales de asistencia, porque modificar
-- la fecha no cambia la cantidad de presentes o ausentes.
--
-- La funcion de rachas ya ignora los eventos excluidos.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_stats_on_event_date_change()
RETURNS TRIGGER AS $$
DECLARE
    v_member_id INTEGER;
BEGIN

    IF OLD.event_date IS DISTINCT FROM NEW.event_date THEN

        FOR v_member_id IN
            SELECT member_id
            FROM event_attendance
            WHERE event_id = NEW.id
        LOOP

            PERFORM refresh_consecutive_absences(v_member_id);

        END LOOP;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_event_date_change
AFTER UPDATE OF event_date ON events
FOR EACH ROW
EXECUTE FUNCTION sync_stats_on_event_date_change();


-- ------------------------------------------------------------
-- FUNCION: sync_general_stats_on_event_change
-- ------------------------------------------------------------
-- Se ejecuta cuando cambia:
-- - counts_for_general_stats de un evento.
-- - type_id de un evento.
--
-- Compara si el evento realmente cambio su participacion
-- en las estadisticas generales.
--
-- Si cambio, recalcula las estadisticas generales de todos
-- los miembros registrados en ese evento.
--
-- Si el resultado efectivo sigue siendo igual, no recalcula.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_general_stats_on_event_change()
RETURNS TRIGGER AS $$
DECLARE
    v_old_counts BOOLEAN;
    v_new_counts BOOLEAN;
    v_member_id INTEGER;
BEGIN

    SELECT COALESCE(
        OLD.counts_for_general_stats,
        et.counts_for_general_stats,
        TRUE
    )
    INTO v_old_counts
    FROM (SELECT 1) AS dummy
    LEFT JOIN event_types et ON et.id = OLD.type_id;

    SELECT COALESCE(
        NEW.counts_for_general_stats,
        et.counts_for_general_stats,
        TRUE
    )
    INTO v_new_counts
    FROM (SELECT 1) AS dummy
    LEFT JOIN event_types et ON et.id = NEW.type_id;

    IF v_old_counts IS DISTINCT FROM v_new_counts THEN

        FOR v_member_id IN
            SELECT member_id
            FROM event_attendance
            WHERE event_id = NEW.id
        LOOP

            PERFORM refresh_member_general_stats(v_member_id);

        END LOOP;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_general_stats_event_change
AFTER UPDATE OF counts_for_general_stats, type_id
ON events
FOR EACH ROW
EXECUTE FUNCTION sync_general_stats_on_event_change();


-- ------------------------------------------------------------
-- FUNCION: sync_general_stats_on_type_change
-- ------------------------------------------------------------
-- Se ejecuta cuando cambia counts_for_general_stats
-- de un tipo de evento.
--
-- Recalcula las estadisticas generales de los miembros
-- que tengan asistencias en eventos de ese tipo.
--
-- Solo considera eventos que heredan la configuracion del
-- tipo (counts_for_general_stats IS NULL).
--
-- Los eventos con TRUE o FALSE individual no se ven afectados.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION sync_general_stats_on_type_change()
RETURNS TRIGGER AS $$
DECLARE
    v_member_id INTEGER;
BEGIN

    IF OLD.counts_for_general_stats
       IS DISTINCT FROM NEW.counts_for_general_stats THEN

        FOR v_member_id IN

            SELECT DISTINCT ea.member_id
            FROM event_attendance ea
            JOIN events e ON e.id = ea.event_id

            WHERE e.type_id = NEW.id
              AND e.counts_for_general_stats IS NULL

        LOOP

            PERFORM refresh_member_general_stats(v_member_id);

        END LOOP;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_general_stats_type_change
AFTER UPDATE OF counts_for_general_stats
ON event_types
FOR EACH ROW
EXECUTE FUNCTION sync_general_stats_on_type_change();


-- ============================================================
-- FIN DE ESTADISTICAS GENERALES
-- ============================================================






---trigers y funciones de estadisticas de miembro por typo de evento


CREATE OR REPLACE FUNCTION refresh_member_type_stats(
    p_member_id INTEGER
)
RETURNS VOID AS $$
BEGIN

    DELETE FROM events_member_type_stats
    WHERE member_id = p_member_id;

    INSERT INTO events_member_type_stats (
        member_id,
        event_type_id,
        total_present,
        total_absences,
        total_justified
    )
    SELECT
        ea.member_id,
        e.type_id,

        COUNT(*) FILTER (
            WHERE ea.status = 'present'
        ),

        COUNT(*) FILTER (
            WHERE ea.status = 'absent'
        ),

        COUNT(*) FILTER (
            WHERE ea.status = 'justified'
        )

    FROM event_attendance ea
    JOIN events e ON e.id = ea.event_id

    WHERE ea.member_id = p_member_id
      AND e.type_id IS NOT NULL

    GROUP BY ea.member_id, e.type_id;

END;
$$ LANGUAGE plpgsql;


--

CREATE OR REPLACE FUNCTION sync_member_type_stats()
RETURNS TRIGGER AS $$
BEGIN

    IF TG_OP = 'DELETE' THEN
        PERFORM refresh_member_type_stats(OLD.member_id);
        RETURN OLD;
    END IF;

    PERFORM refresh_member_type_stats(NEW.member_id);

    IF TG_OP = 'UPDATE'
       AND OLD.member_id <> NEW.member_id THEN

        PERFORM refresh_member_type_stats(OLD.member_id);

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_sync_member_type_stats
AFTER INSERT OR UPDATE OR DELETE
ON event_attendance
FOR EACH ROW
EXECUTE FUNCTION sync_member_type_stats();

-- este es para cuando un evento cambia  de tipo  si de mision pasa a ser entrenamiento

CREATE OR REPLACE FUNCTION sync_stats_on_event_type_change()
RETURNS TRIGGER AS $$
DECLARE
    v_member_id INTEGER;
BEGIN

    IF OLD.type_id IS DISTINCT FROM NEW.type_id THEN

        FOR v_member_id IN
            SELECT member_id
            FROM event_attendance
            WHERE event_id = NEW.id
        LOOP
            PERFORM refresh_member_type_stats(v_member_id);
        END LOOP;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_event_type_change
AFTER UPDATE OF type_id
ON events
FOR EACH ROW
EXECUTE FUNCTION sync_stats_on_event_type_change();