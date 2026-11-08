--permisos
INSERT INTO permissions (name) VALUES
('members.view'),
('members.create'),
('members.edit'),
('members.delete'),
('attendance.view'),
('attendance.create'),
('attendance.edit'),
('attendance.delete'),
('users.view'),
('users.create'),
('users.edit'),
('users.delete'),
('audit_logs.view'),
('roles.create'),
('roles.edit'),
('roles.delete');

-- =========================================
-- ROLES PREDETERMINADOS
-- =========================================

INSERT INTO roles (name)
VALUES
    ('Administrador'),
    ('Gestor'),
    ('Oficial de unidad'),
    ('Registrador'),
    ('Observador');


-- =========================================
-- PERMISOS POR ROL
-- =========================================

-- Administrador: todos los permisos
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrador';


-- Gestor: administración de miembros y asistencias
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Gestor'
AND p.name IN (
    'members.view',
    'members.create',
    'members.edit',
    'members.delete',
    'attendance.view',
    'attendance.create',
    'attendance.edit',
    'attendance.delete'
);


-- Oficial de unidad: gestión operativa
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Oficial de unidad'
AND p.name IN (
    'members.view',
    'members.create',
    'members.edit',
    'attendance.view',
    'attendance.create',
    'attendance.edit'
);


-- Registrador: gestión de asistencias
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Registrador'
AND p.name IN (
    'members.view',
    'attendance.view',
    'attendance.create',
    'attendance.edit'
);


-- Observador: solo lectura
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Observador'
AND p.name IN (
    'members.view',
    'attendance.view'
);

-- Rangos
INSERT INTO ranks (rank_name, display_order, short_name, plural_name) VALUES
    ('Oficial',     1, '',    'Oficiales'),
    ('Infante',     2, 'INF', 'Infantes'),
    ('Cadete',      3, 'CDTE', 'Cadetes'),
    ('Aspirante',   4, 'ASP',  'Aspirantes'),
    ('Recluta',     5, 'RCT',  'Reclutas'),
    ('Postulante',  6, '',     'Postulantes');


-- Unidades
INSERT INTO units (id, name, short_name, logo_url) VALUES
    (1, 'Unidad de Asalto Aereo Cuervo', 'U.A.A.C', 'https://static.danycode.dev/logo/LOGO_UAAC.png'),
    (2, 'Grupo de Asalto Alacrán', 'G.A.A', 'https://static.danycode.dev/logo/LOGO_GAA.png'),
    (3, 'Grupo de Sabotaje Puma', 'G.S.P', 'https://static.danycode.dev/logo/LOGO_GSP.png');


-- =========================================
-- MIEMBROS INICIALES (DATOS FICTICIOS)
-- =========================================

-- Oficiales
INSERT INTO members (nickname, rank_id, unit_id, nationality_code, join_date) VALUES
    ('Pegaso',      1, NULL, 'CL', '2023-01-15'),
    ('Eban',        1, 1,    'AR', '2023-03-22'),
    ('Lucho',       1, 3,    'CL', '2023-05-10'),
    ('Spectro',     1, 3,    'UY', '2023-07-08'),
    ('Ares',        1, 3,    'AR', '2023-09-14');

-- Infantes
INSERT INTO members (nickname, rank_id, unit_id, nationality_code, join_date) VALUES
    ('Fenix',       2, 3, 'CL', '2023-11-02'),
    ('Ragnar',      2, 1, 'PE', '2024-01-19'),
    ('Vortex',      2, 2, 'AR', '2024-02-11');

-- Cadetes
INSERT INTO members (nickname, rank_id, unit_id, nationality_code, join_date) VALUES
    ('Sombra',      3, 2, 'CL', '2024-03-05'),
    ('Trueno',      3, 3, 'CL', '2024-04-17');

-- Aspirantes
INSERT INTO members (nickname, rank_id, unit_id, nationality_code, join_date) VALUES
    ('Kraken',      4, 3, 'MX', '2024-05-09'),
    ('Lince',       4, 2, 'CL', '2024-06-21'),
    ('Boreal',      4, 2, 'AR', '2024-07-13'),
    ('Halcon',      4, 2, 'CO', '2024-08-04'),
    ('Onix',        4, 1, 'PE', '2024-09-25'),
    ('Nexus',       4, 2, 'CL', '2024-10-16'),
    ('Raptor',      4, 2, 'UY', '2024-11-07'),
    ('Atlas',       4, 2, 'AR', '2024-12-12'),
    ('Delta',       4, 2, 'CO', '2025-01-20'),
    ('Cobra',       4, 2, 'CL', '2025-02-14'),
    ('Orion',       4, 3, 'MX', '2025-03-08'),
    ('Gladius',     4, 3, 'PE', '2025-04-19'),
    ('Vulcano',     4, 3, 'CL', '2025-05-06'),
    ('Phantom',     4, 2, NULL, '2025-06-23');

-- Reclutas
INSERT INTO members (nickname, rank_id, unit_id, nationality_code, join_date) VALUES
    ('Eclipse',     5, 2, 'AR', '2025-07-11'),
    ('Hydra',       5, 2, 'CO', '2025-08-15'),
    ('Falcon',      5, 2, 'CL', '2025-09-03'),
    ('Bisonte',     5, 2, 'BO', '2025-09-27'),
    ('Centella',    5, 2, 'MX', '2025-10-18'),
    ('Jaguar',      5, 2, 'CL', '2025-11-09'),
    ('Escorpion',   5, 2, 'AR', '2025-12-04'),
    ('Tormenta',    5, 2, 'CO', '2026-01-12'),
    ('Cosmos',      5, 2, 'PE', '2026-02-07'),
    ('Tempestad',   5, 2, 'CL', '2026-03-15'),
    ('Vector',      5, 2, 'EC', '2026-04-09'),
    ('Niebla',      5, 2, 'AR', '2026-05-21'),
    ('Dynamo',      5, 2, 'CO', '2026-06-14'),
    ('Artemis',     5, 2, 'CL', '2026-07-03'),
    ('Nebula',      5, 2, 'PY', '2026-08-26');