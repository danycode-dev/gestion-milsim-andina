# Pendientes

- [x] Agregar endpoint y botón para eliminar miembros de forma lógica.
- [x] Permitir editar la unidad de cada miembro.
- [x] Implementar la visualización de `audit_logs` en el frontend.
- [x] Implementar `consecutive_absences` en el frontend.
- [x] Ampliar la información de los miembros: fecha de ingreso, país, etc.
- [x] Arreglar bug en modal visual member al actualisar miembro no se refresca la info de la modal
- [x] Agregar gestión de roles y permisos de usuarios.
- [ ] Agregar sistema de anotaciones( info sensible asi que deve ser con permisos especiales)
- [ ] Agregar descricion de eventos (esta implementado en la Db pero no en Front-end)
- [ ] Agregar filtos  y botones para ordena las estadisticas
- [ ] Permitir vincular miembros con sus cuentas de Discord del servidor.
- [ ] la posibilidad de justificarse por uno o mas dias a traves de un boton de discord
- [ ] Agregar gestión de unidades y parches.
- [ ] Implementar en el frontend la configuración de eventos que no cuentan para las estadísticas generales (por tipo e individualmente).(actualmente solo esta aplicado en el backend)
- [ ] Permitir agregar imágenes a los miembros.(2 imagenes la ic y la de ds)
- [ ] Registrar `audit_logs` en la mayoría de los endpoints de escritura y modificación (actualmente solo esta aplicado a eventos y asistencias, y miembros).
- [ ] Implementar navegación mediante React Router.
- [ ] Revisar si `events_attended` tiene utilidad; eliminarlo si no se utiliza.

- [ ] Añadir Alertas globales en operaciones fetch que se manejen por  fuera  del control directo de un boton
- [Revisar] Añadir en todas las modales Alertas_globales cuando terminen una operacion ya sea por error o por confirmacion 
- [ ] pasar  el delete_at de member a TIMESTAMPTZ  esto implica migrar en la  bd de prod
- [ ] Optimizar la recarga de datos  cuando se realisa un cambio
- [ ] Seguridad: añadir col en Db roles para  poder bloquear un rol  para bloqueaar roles criticos como administrador y no puedan ser modificados 



---

# Futuro

- [ ] permitir poner foto o link a los usarios(solo estetico)
- [ ] Permitir la consolidacion de equipos dinamicos para uso en vivo
- [ ] permitir ingrso  por outh2.0 al sistema a usarios de discord permitidos o vinculacion de cuenta
 ### Congelación y consolidación de eventos

- [ ] Implementar bloqueo de edición de eventos y asistencias mediante `locked_at`.
- [ ] Crear `events_member_stats_history` para estadísticas generales acumuladas por miembro.
- [ ] Crear `events_member_type_stats_history` para estadísticas acumuladas por miembro y tipo.
- [ ] Implementar consolidación de eventos antiguos en orden cronológico.
- [ ] Al consolidar, sumar las estadísticas al histórico existente y registrar `consolidated_at`, evitando duplicaciones.
- [ ] Mantener las asistencias originales para consultas históricas.
- [ ] Calcular estadísticas finales combinando el histórico acumulado y los eventos no consolidados.
- [ ] Conservar las ausencias consecutivas entre el histórico y los eventos recientes.
- [ ] Mantener las tablas de estadísticas actuales como fuente de los totales finales para el frontend.
- [ ] Agregar paginación o búsqueda de eventos antiguos en el frontend.
- [ ] Impedir eliminar eventos consolidados.

### Consideraciones

- Los eventos excluidos de estadísticas generales siguen contando en las estadísticas por tipo.
- Un evento congelado no necesariamente está consolidado.
- La consolidación debe realizarse mediante transacciones para evitar inconsistencias.
- Los eventos con asistencias no pueden eliminarse (`ON DELETE RESTRICT`).
- Evaluar eliminación o archivado de registros antiguos solo si el almacenamiento llega a ser un problema.