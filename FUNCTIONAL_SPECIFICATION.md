# LSC Game Center - Functional Specification

Este documento es la fuente de verdad absoluta del producto. Define qué estamos construyendo, para quién y por qué. No aborda decisiones tecnológicas, arquitectónicas ni bases de datos; se centra puramente en la experiencia y funcionalidad del sistema.

---

## 1. Objetivo del Producto

**¿Qué problema resuelve?**
Las ligas de básquetbol amateur y semi-profesionales suelen depender de planillas de papel para registrar estadísticas, las cuales luego se transcriben a hojas de cálculo o sistemas anticuados. Esto provoca lentitud, errores humanos y una desconexión total con los fanáticos y jugadores que desean consumir esa información en tiempo real.

**¿Para quién está construido?**
Para todos los actores de la Liga de Básquetbol San Clemente (organización, jugadores y fanáticos). 

**¿Qué hace diferente a esta plataforma?**
No es un sistema administrativo. Es un producto digital premium que eleva el prestigio de la liga. Convierte un partido de gimnasio en una experiencia con calidad de transmisión oficial, entregando datos en vivo con la fluidez y estética de las mejores aplicaciones deportivas del mundo (NBA, Apple, Sofascore).

---

## 2. Usuarios

El sistema interactúa con distintos tipos de usuarios, cada uno con necesidades diametralmente opuestas:

*   **Administrador:** Necesita control total sobre la estructura de la liga. Puede crear temporadas, registrar equipos, gestionar plantillas y programar el calendario (fixture). Su experiencia debe ser clara y libre de fricciones.
*   **Mesa (Operador de Control Center):** Necesita velocidad extrema y precisión bajo presión. Durante el partido, no tiene tiempo para navegar menús complejos. Su interfaz debe ser como una caja registradora (POS), enfocada 100% en capturar la acción en milisegundos.
*   **Árbitro:** Necesita autoridad. Su rol es validar la información al final del encuentro. Requiere un resumen claro del acta del partido para firmar y cerrar (oficializar) el encuentro, bloqueando futuras ediciones.
*   **Jugador:** Necesita reconocimiento. Desea ver su rendimiento histórico, compararse con sus pares, analizar sus estadísticas y compartir sus logros. Su perfil debe sentirse como una tarjeta de jugador profesional.
*   **Entrenador:** Necesita análisis rápido. Requiere acceso al Box Score, rendimiento del equipo (W-L, puntos a favor/contra) y estadísticas de sus próximos rivales.
*   **Público (Espectador / Fanático):** Necesita inmediatez y emoción. Quiere saber quién va ganando *ahora mismo*, quién es el MVP, revisar la jugada a jugada (timeline) de un partido en vivo y mirar la tabla de posiciones con una interfaz limpia, sin distracciones.

---

## 3. Módulos

La plataforma se compone de los siguientes módulos funcionales:

1.  **Dashboard (Home Administrativo)**
2.  **Gestor de Temporadas y Ligas**
3.  **Gestor de Equipos y Roster**
4.  **Gestor de Jugadores (Directorio)**
5.  **Calendario y Fixture (Fechas y Partidos)**
6.  **Control Center (El motor de la mesa en vivo)**
7.  **Game Center (Portal Público)**
8.  **Match Hub (Detalle de Partido)**
9.  **Standings (Tabla de Posiciones)**
10. **Leaders & Stats (Ranking de Jugadores)**
11. **Perfiles de Jugador**
12. **Perfiles de Equipo**
13. **Media & Noticias (Futuro)**
14. **Configuración de Plataforma**
15. **Asistente de Configuración Inicial (Setup Wizard)**

---

## 4. Funcionalidades (Por Módulo)

### Control Center (Mesa)
*   **Objetivo:** Capturar el historial de eventos del partido con cero fricción.
*   **Casos de uso:** Registrar puntos, faltas, tiempos muertos, sustituciones. Corrección de errores.
*   **Acciones:** Iniciar/detener reloj de cuarto, anotar (+1, +2, +3), registrar falta, pedir timeout, deshacer/editar línea de tiempo, finalizar partido.
*   **Restricciones:** Solo accesible por personal autorizado el día del partido. No calcula estadísticas, solo despacha eventos.
*   **Estados del módulo:** Pre-game (setup), Live, Halftime, Post-game (revisión).

### Game Center (Home Público)
*   **Objetivo:** Responder a la pregunta "¿Qué está pasando hoy?".
*   **Casos de uso:** Fanático abre la app un sábado por la tarde para seguir la liga.
*   **Acciones:** Ver partido destacado (en vivo), navegar a partidos del día, ver resumen rápido de la tabla.
*   **Restricciones:** 100% de solo lectura. Sin requerimiento de login.

### Match Hub (Detalle de Partido - Público)
*   **Objetivo:** Entregar la narrativa completa de un juego específico.
*   **Casos de uso:** Consultar cómo va un partido, quién está jugando bien, o qué pasó hace 5 minutos.
*   **Acciones:** Ver marcador en vivo, Timeline de eventos, Box Score (estadísticas de jugadores), Gráfico de inercia (futuro).
*   **Restricciones:** Los datos deben fluir en tiempo real si el partido está *Live*.

### Standings & Leaders (Tablas y Rankings)
*   **Objetivo:** Mostrar la jerarquía competitiva de la liga.
*   **Casos de uso:** Saber quién va primero, quién es el goleador del torneo, quién da más asistencias.
*   **Acciones:** Filtrar tabla de posiciones, ver top 5 anotadores, reboteros, asistidores.
*   **Estados:** Actualizado instantáneamente al finalizar un partido oficial.

### Perfiles (Jugadores y Equipos)
*   **Objetivo:** Proveer identidad digital.
*   **Casos de uso:** Un jugador busca su nombre para ver su promedio de puntos o compartir su perfil en redes.
*   **Acciones:** Ver promedios de temporada, historial de partidos, récord (W-L) del equipo, roster actual.

### Gestor Administrativo (Ligas, Temporadas, Calendario)
*   **Objetivo:** Estructurar el torneo.
*   **Casos de uso:** El presidente de la liga organiza el campeonato de apertura.
*   **Acciones:** Crear nueva temporada, inscribir equipos, generar fechas, programar horarios de partidos, validar actas cerradas.

---

## 5. Flujo Completo (Ciclo de Vida de la Plataforma)

1.  **Estructuración:** Admin crea la "Temporada Apertura". Inscribe a los Equipos. Los Equipos cargan sus Rosters (Jugadores).
2.  **Programación:** Admin crea la "Fecha 1" y programa 3 Partidos, asignando horarios.
3.  **Pre-Match:** El día del partido, la Mesa abre el Control Center, selecciona el partido programado y confirma los 12 jugadores presentes por equipo (Convocados).
4.  **Live Action:** El partido comienza. La Mesa registra cada evento (+2 de Juan, Falta de Pedro, Timeout Equipo A). El Game Center transmite esto en vivo al público.
5.  **Post-Match:** Suena la chicharra final. La Mesa cierra el partido. El Árbitro revisa el acta digital y la aprueba (`Oficializado`).
6.  **Actualización:** Automáticamente (por efecto de los eventos), la Tabla de Posiciones cambia, el Ranking de Goleadores se ajusta y los Perfiles de Jugador actualizan sus promedios.
7.  **Finalización:** Se juegan los Playoffs, se corona a un campeón y la Temporada se marca como finalizada (Archivo Histórico).

---

## 6. MVP (Minimum Viable Product)

El MVP debe ser diminuto pero impecable. Calidad sobre cantidad.

**QUÉ ENTRA:**
*   **Core Admin:** Crear Temporada, Equipos, Jugadores (Nombres y Números básicos) y programar 1 Partido.
*   **Control Center (Básico):** Pantalla de POS para registrar Puntos (+1, +2, +3), Faltas y Tiempos Muertos. Control de los 4 Cuartos.
*   **Game Center (Básico):** Home con los partidos del día (Marcador en vivo).
*   **Match Hub:** Timeline (lista textual de eventos) y Box Score (Estadísticas del partido por jugador).

**QUÉ NO ENTRA (Se excluye estrictamente del MVP):**
*   Estadística de +/- (Substituciones durante el partido).
*   Registro de Rebotes, Asistencias, Robos o Tapones (La mesa solo registrará puntos y faltas para simplificar el MVP).
*   Perfiles de Jugador con gráficos.
*   Login de usuarios públicos.
*   Sponsors o Noticias.
*   Firma digital del árbitro.

---

## 7. Funcionalidades Futuras (El Roadmap Visionario)

*   **Play-by-Play Avanzado:** Inclusión de rebotes, asistencias y mapa de calor de tiros (Shot Chart).
*   **Gestión de Sustituciones:** Tracking exacto del quinteto en cancha para calcular el Plus/Minus (+/-) de cada jugador.
*   **Media Center:** Adjuntar videos de "Highlights" a eventos específicos en el Timeline. Subir galerías de fotos del partido.
*   **Logros y Récords:** "Jugador de la Fecha", "Récord de triples en un partido", medallas digitales en los perfiles.
*   **Comparador:** Herramienta visual para enfrentar las estadísticas de dos jugadores.
*   **Push Notifications:** Alertas al teléfono del público ("¡Comienza el último cuarto a 3 puntos de diferencia!").
*   **Modo Entrenador:** Dashboard avanzado para cuerpos técnicos con métricas avanzadas (Eficiencia ofensiva/defensiva).

---

## 8. Product Principles (Mandamientos inquebrantables)

1.  **La Mesa dicta la realidad:** La única forma en que una estadística existe, es si la mesa registró un evento que la fundamenta. No hay inputs manuales de totales.
2.  **Velocidad ante todo en el Control Center:** Un operador de mesa nunca debe apartar la vista de la cancha por más de un segundo. Taps grandes, sin confirmaciones innecesarias, máximo dos clics por acción común.
3.  **Una pregunta por pantalla:** El diseño público (Game Center) debe tener foco láser. Sin interfaces sobrecargadas de paneles de control administrativos. 
4.  **Premium y Moderno (Zero Excel-vibe):** Los datos deben sentirse como una app de consumo masivo, con jerarquía tipográfica, animaciones sutiles y máximo respeto por el espacio en blanco.
5.  **Perdón de errores (Undo as a First-Class Citizen):** En un deporte rápido, la mesa se equivocará. El sistema debe permitir corregir el pasado reciente de forma elegante y recalcular todo el universo instantáneamente.
6.  **Offline-first en la trinchera:** El Control Center no puede depender de una conexión a internet perfecta. Debe sobrevivir desconexiones y sincronizar cuando haya señal.

---

## 9. Experiencia

*   **Para el Jugador:** Orgullo. Al buscar su perfil, debe sentir que pertenece a una liga profesional. Los datos, la tipografía y la limpieza de la pantalla deben validar su esfuerzo en la cancha. Debe querer tomar una captura de pantalla y subirla a sus redes.
*   **Para el Espectador:** Conexión y Confianza. Debe sentir la emoción de un marcador que palpita y se actualiza en tiempo real, dándole la seguridad de que la información que está viendo es la verdad absoluta del gimnasio, sin lag.
*   **Para la Organización (Admin/Mesa):** Tranquilidad. El estrés del lápiz, el papel, el cronómetro físico y los borrones desaparece. El sistema debe sentirse como un copiloto confiable que hace las matemáticas pesadas por ellos de manera silenciosa.

---

## 10. Futuro (Visión a 5 años)

En cinco años, LSC Game Center trasciende San Clemente. Ya no es solo un registro de números, es una **red social deportiva estructurada**.

*   El sistema cuenta con un motor de inteligencia que auto-genera "Game Recaps" (narrativas en texto del partido) analizando el flujo de los eventos.
*   Los gimnasios tienen cámaras automáticas y cada evento en el timeline tiene un clip de video de 5 segundos asociado automáticamente por IA.
*   La plataforma ha sido adoptada como el estándar White-Label (marca blanca) para otras ligas de la región, soportando miles de partidos concurrentes.
*   Los jugadores usan la app para reclutamiento, creando portafolios verificados de su rendimiento histórico a lo largo de los años.
*   El Game Center no solo reporta el pasado y el presente, sino que predice: "Probabilidad de victoria: 87% basado en inercia del tercer cuarto". 
*   Es, fundamentalmente, la infraestructura digital invisible que hace que cualquier liga de barrio se sienta como la NBA.
