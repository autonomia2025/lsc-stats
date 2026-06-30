# LSC Game Center - Arquitectura y Modelo de Dominio

## 1. Arquitectura General (CQRS + Event Sourcing)

Para cumplir con la regla de oro ("Todo nace de los eventos"), la plataforma no puede usar una arquitectura tradicional de CRUD (Create, Read, Update, Delete). Utilizaremos **CQRS (Command Query Responsibility Segregation)** apoyado en **Event Sourcing**.

### División de Módulos
1. **Core Domain (El Motor):** Define las reglas de negocio, la máquina de estados del partido y la estructura estricta de los eventos.
2. **Command Side (Control Center):** Aplicación Offline-First. Su única responsabilidad es validar acciones del usuario (Mesa) y emitir "Comandos" que generan "Eventos". No lee estadísticas, solo emite historia.
3. **Event Bus & Processor (El Puente):** Recibe el `MatchEvent`, lo guarda en un log inmutable (Append-Only) y dispara "Proyectores".
4. **Query Side (Game Center):** Los "Proyectores" escuchan los eventos y pre-calculan las estadísticas, guardándolas en "Read Models" (Vistas Materializadas). El público lee de estas vistas ultra-rápidas. Nunca calculan al vuelo.

---

## 2. Modelo de Dominio (Entidades)

### Entidades Estáticas (Setup)
*   **League / Tournament:** Entidad padre.
*   **Season:** Instancia temporal de la liga (Ej: Apertura 2026).
*   **Team:** El club.
*   **Player / Coach / Referee:** Perfiles físicos (Person).
*   **Roster:** Contrato de un jugador con un equipo para una Season.

### Entidades de Partido (Match Context)
*   **Match:** Contexto del enfrentamiento (Local, Visita, Fecha, Estado).
*   **MatchRoster:** Los 12 jugadores convocados *específicos* para ese partido.
*   **MatchEvent:** La fuente de la verdad. (Inmutable).

### Read Models (Proyecciones - Auto-generadas)
*   **MatchScoreProjection:** Marcador actual, faltas de equipo, tiempos muertos restantes.
*   **BoxScoreProjection:** Estadísticas individuales del partido (PTS, REB, AST, FG%, etc.).
*   **SeasonStatsProjection:** Acumulado de la temporada por jugador/equipo.
*   **StandingsProjection:** Tabla de posiciones (W-L, Diferencia de puntos).

---

## 3. Estados del Partido (State Machine)

El `Match` es una máquina de estados estricta. Ciertos eventos solo pueden ocurrir en ciertos estados.

1.  `SCHEDULED`: Creado por Admin.
2.  `ROSTER_CONFIRMED`: Mesa validó los 12 jugadores de cada equipo.
3.  `WARMUP`: Reloj de calentamiento corriendo.
4.  `Q1_LIVE` ➔ `Q1_ENDED`
5.  `Q2_LIVE` ➔ `HALFTIME`
6.  `Q3_LIVE` ➔ `Q3_ENDED`
7.  `Q4_LIVE`
8.  `OVERTIME_LIVE` (Si hay empate) ➔ `OVERTIME_ENDED`
9.  `FINISHED`: Suena la chicharra final.
10. `OFFICIALIZED`: Árbitro revisa y firma digitalmente (Bloqueo total, no más correcciones de eventos).
11. `CANCELLED` / `ABANDONED`

---

## 4. Filosofía de Eventos (Event Dictionary)

La Mesa emite comandos, el sistema guarda eventos.

*   `MATCH_STARTED` / `MATCH_FINISHED`
*   `PERIOD_STARTED` / `PERIOD_ENDED`
*   `CLOCK_STARTED` / `CLOCK_STOPPED`
*   `SHOT_MADE` (Firma: player, type: 1|2|3, assisted_by)
*   `SHOT_MISSED`
*   `REBOUND` (type: offensive | defensive)
*   `FOUL` (type: personal | technical | unsportsmanlike)
*   `TURNOVER` / `STEAL` / `BLOCK`
*   `TIMEOUT_CALLED`
*   `SUBSTITUTION` (player_in, player_out) -> *Vital para la estadística de Plus/Minus (+/-).*

---

## 5. Roles y Permisos

1.  **Admin (Backoffice):** Crea ligas, temporadas, aprueba equipos, programa fechas (fixtures). No puede modificar un partido en vivo.
2.  **Mesa / Operador (Control Center):** Autoridad suprema durante el partido (desde `ROSTER_CONFIRMED` hasta `FINISHED`). Emite eventos.
3.  **Árbitro (Control Center - Auth especial):** Revisa el Box Score al finalizar y cambia estado a `OFFICIALIZED`.
4.  **Público (Game Center):** Lectura pasiva. Suscripción a WebSockets/SSE para actualizaciones en tiempo real.

---

## 6. Flujo Completo del Producto

1.  **Admin** crea el `Match` (San Clemente vs Maule) para el Sábado.
2.  Llega el Sábado. **Mesa** abre el Control Center (iPad).
3.  **Mesa** selecciona a los 12 jugadores de cada equipo (`ROSTER_CONFIRMED`).
4.  **Mesa** selecciona los 5 titulares iniciales (`SUBSTITUTION` events masivos).
5.  Árbitro lanza el balón. **Mesa** presiona "Iniciar Q1" (`PERIOD_STARTED`, `CLOCK_STARTED`).
6.  Jugador A anota. **Mesa** presiona `+2` ➔ `Jugador A`.
7.  El sistema genera `SHOT_MADE`.
8.  El `Event Processor` actualiza el `MatchScoreProjection` y `BoxScoreProjection`.
9.  El **Público** en sus casas ve cómo el marcador salta instantáneamente en el Game Center.

---

## 7. Roadmap Recomendado (Fases)

*   **Fase 1: El Motor Lógico (Headless):** Implementar la base de datos, los modelos de dominio, el bus de eventos y un script que simule un partido completo. *Objetivo: Validar que 100 eventos generan un Box Score perfecto sin UI.*
*   **Fase 2: POS Control Center (Operación):** Interfaz para la Mesa. Botones grandes, optimización de clics, manejo de estado offline-first. *Objetivo: Registrar un partido real más rápido que en papel.*
*   **Fase 3: Game Center Real-Time (Consumo Público):** La UI Premium que ya esbozamos, conectada a los Read Models y WebSockets para actualizar en tiempo real.
*   **Fase 4: Ecosistema y Contexto:** Perfiles históricos, tabla de posiciones dinámica, MVP calculado por algoritmo, líderes de temporada.

---

## 8. Riesgos y Críticas a tu Idea (La mirada del Arquitecto)

1.  **La falacia de "Deshacer la última jugada":**
    *   *El problema:* En básquetbol, la mesa puede darse cuenta de un error 3 minutos tarde ("Le dimos los puntos al #5 pero era el #6"). Un simple botón de "Undo" (Ctrl+Z) es inútil porque destruiría los 10 eventos que ocurrieron después.
    *   *La solución:* Necesitamos eventos compensatorios (`EVENT_CORRECTED` o `EVENT_VOIDED`). La UI del Control Center necesita un "Timeline Editable" donde la mesa pueda tocar un evento de hace 3 minutos y reasignar el jugador, lo que dispara un evento de corrección sin romper el orden del tiempo.

2.  **La Gestión del Reloj (Game Clock):**
    *   *El problema:* ¿El reloj de la app será el reloj oficial del gimnasio? Si la mesa tiene que mirar el tablero físico y replicar iniciar/parar en el iPad, habrá un retraso humano constante de 1-2 segundos.
    *   *La solución:* Los eventos deben guardar el tiempo oficial (`game_clock: "08:12"`), no el timestamp de creación del servidor (`created_at`). La mesa debe tener una interfaz robusta para corregir el reloj de la app fácilmente.

3.  **Substituciones y la estadística +/-:**
    *   *El problema:* Si quieres una app "nivel NBA", necesitas la estadística de Plus/Minus (¿Cómo le fue al equipo mientras X estaba en cancha?). Para esto, la mesa DEBE registrar los cambios (Entra #10, Sale #4). Esto rompe tu regla de "máxima velocidad", porque registrar sustituciones masivas es lento.
    *   *La solución:* UI especializada de "Quinteto en cancha". La mesa debe poder arrastrar jugadores rápidamente (Drag & Drop) durante los tiempos muertos. Si no registramos quién está en cancha, el producto nunca será "Premium", será amateur.

4.  **"Nunca guardar estadísticas" es peligroso para el performance:**
    *   *El problema:* Si el público pide ver "Los líderes anotadores históricos de la liga", e intentas calcularlo leyendo 50,000 eventos al vuelo... el servidor colapsará.
    *   *La solución:* Como mencioné, usaremos CQRS. Sí guardaremos estadísticas, pero las trataremos como "Caché validado" (Vistas Materializadas). El usuario final solo lee de la caché. El motor se encarga de que la caché sea un reflejo perfecto e inmutable de los eventos.
