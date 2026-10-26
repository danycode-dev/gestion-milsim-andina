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
('audit_logs.view');

INSERT INTO roles (name) VALUES
('admin'),
('editor'),
('Mando GAA'),
('viewer');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'editor'
AND p.name IN (
    'members.view',
    'members.create',
    'members.edit',
    'attendance.view',
    'attendance.create',
    'attendance.edit'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Mando GAA'
AND p.name IN (
    'members.view',
    'members.create',
    'attendance.view',
    'attendance.create',
    'attendance.edit'
);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'viewer'
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
    (1, 'Unidad de Asalto Aereo Cuervo', 'U.A.A.C', NULL),
    (2, 'Grupo de Asalto Alacrán', 'G.A.A', 'https://static.danycode.dev/logo/LOGO_GAA.png'),
    (3, 'Grupo de Sabotaje Puma', 'G.S.P', 'https://static.danycode.dev/logo/LOGO_GSP.png');


-- Oficiales
INSERT INTO members (nickname, rank_id, unit_id) VALUES
    ('Pegaso',  1, NULL),
    ('Eban',    1, 1),
    ('Lucho',   1, 3),
    ('Venom',   1, 3),
    ('Gonxol',  1, 3);


-- Oficiales
INSERT INTO members (nickname, rank_id, unit_id) VALUES
    ('Pepos',   2, 3),
    ('Necros',  2, 1),
    ('Gestgu',  2, 2);

-- Cadetes
INSERT INTO members (nickname, rank_id, unit_id) VALUES
    ('Panamasado',  3, 2),
    ('Daniel',  3, 3);


-- Aspirantes
INSERT INTO members (nickname, rank_id, unit_id) VALUES
    ('Butin',      4, 3),
    ('Carcho',     4, 2),
    ('Panamasado', 4, 2),
    ('Calaca',     4, 2),
    ('Elbno',      4, 1),
    ('Carrera',    4, 2),
    ('Ncu',        4, 2),
    ('Mitzio',     4, 2),
    ('Sonidero',   4, 2),
    ('Hunter',     4, 2),
    ('Marucha',    4, 3),
    ('Miyamas',    4, 3),
    ('Tengu',      4, 3),
    ('HardB',      4, 2);


-- Reclutas
INSERT INTO members (nickname, rank_id, unit_id) VALUES
    ('Cerec',            5, 2),
    ('Daniel Villalba',  5, 2),
    ('Di Campino',       5, 2),
    ('Esteban',          5, 2),
    ('GuilletreX',       5, 2), 
    ('NCU',              5, 2),
    ('NejiiDark',        5, 2),
    ('Parasyte',         5, 2),
    ('Relan',            5, 2),
    ('ASUS',             5, 2),
    ('Boloncho',         5, 2),
    ('Facun',            5, 2),
    ('GuardiaN',         5, 2),
    ('Tafu',             5, 2),
    ('TomiCheddar',      5, 2);