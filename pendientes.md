# Pendientes

- [x] Agregar endpoint y botón para eliminar miembros de forma lógica.
- [x] Permitir editar la unidad de cada miembro.
- [ ] Ampliar la información de los miembros: fecha de ingreso, anotaciones, país, etc.
- [ ] Agregar gestión de unidades y parches.
- [ ] Permitir vincular miembros con sus cuentas de Discord del servidor.
- [ ] Implementar en el frontend la configuración de eventos que no cuentan para las estadísticas generales (por tipo e individualmente).(actualmente solo esta aplicado en el backend)
- [ ] Agregar gestión de roles y permisos de usuarios.
- [x] Implementar la visualización de `audit_logs` en el frontend.
- [ ] Permitir agregar imágenes a los miembros.
- [ ] Registrar `audit_logs` en la mayoría de los endpoints de escritura y modificación (actualmente solo esta aplicado a eventos y asistencias).
- [ ] Implementar navegación mediante React Router.
- [x] Implementar `consecutive_absences` en el frontend.
- [ ] Revisar si `events_attended` tiene utilidad; eliminarlo si no se utiliza.

- [ ] Añadir Alertas globales en operaciones fetch que se manejen por  fuera  del control directo de un boton
- [ ] Añadir en todas las modales Alertas_globales cuando terminen una operacion ya sea por error o por confirmacion 
- [ ] pasar  el delete_at de member a TIMESTAMPTZ  esto implica migrar en la  bd de prod
- [ ] 
- [ ] 
- [ ] 



---

# Futuro

- [ ] permitir poner foto o link a los usarios(solo estetico)

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