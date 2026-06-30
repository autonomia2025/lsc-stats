# LSC Game Center - Product Foundation

Como Product Designer de Apple, UX de Sofascore y Software Architect, he analizado tu visión para la Liga de Básquetbol San Clemente. Es un proyecto ambicioso y requiere una ejecución impecable para no caer en la típica trampa de "software administrativo deportivo".

A continuación, presento el diseño del producto, la arquitectura y los desafíos que debemos abordar antes de escribir código.

---

## 🏗️ 1. Desafíos a tu visión (Como Arquitecto y Diseñador)

Antes de pasar a la estructura, debo desafiar dos de tus premisas para garantizar que el producto sea profesional, rápido y escalable.

1. **"Nunca guardar estadísticas manualmente. Siempre se calculan desde el historial"**
   * **El desafío:** Si recalculamos las estadísticas de la temporada de un jugador iterando sobre cada evento de cada partido cada vez que alguien abre su perfil, el Game Center (Público) será lento y colapsará bajo tráfico.
   * **La solución (CQRS + Event Sourcing):** Tienes razón en que la *fuente de la verdad* son los eventos. Nunca un humano digitará un total. Sin embargo, implementaremos **Materialized Views o Projections**. Cuando el Control Center emite un evento (`PLAYER_SCORED_3PT`), el sistema guarda el evento en el *Append-Only Log* y, asíncronamente, **actualiza una tabla de lectura estática** de estadísticas. Así, el Game Center lee datos pre-calculados en 10ms.
2. **"Control Center: Registrar una jugada nunca debería requerir más de dos clics"**
   * **El desafío:** En básquetbol, una jugada tiene múltiples dimensiones (Ej: Asistencia de X -> Tiro de 3 de Y -> Falta de Z). Dos clics es insuficiente para capturar el contexto completo sin crear una interfaz caótica llena de botones combinados.
   * **La solución:** Interfaz de "Caja Registradora" (POS). Clic 1: Acción (+2, Falta, Rebote). Clic 2: Jugador. El sistema deduce el resto. Si es un +2 y el operador quiere añadir asistencia, aparece un *toast* no bloqueante de 3 segundos: "¿Asistencia? [Jugador A] [Jugador B]". Si lo ignora, sigue el juego. Velocidad ante todo.
3. **Resiliencia Offline:**
   * Las canchas (gimnasios) tienen pésima conexión a internet. El Control Center **debe ser Offline-First**. Los eventos se guardan en el navegador (`IndexedDB`) y se sincronizan al servidor en segundo plano.

---

## 🏛️ 2. Arquitectura del Sistema

El sistema se divide lógicamente (CQRS), aunque físicamente viva en el mismo servidor (Monolito Modular por ahora, escalable a microservicios).

*   **Frontend (App):** React 19 + TypeScript + Vite + Tailwind CSS. PWA para offline support.
*   **Backend (API):** Express.js (o tRPC si queremos tipado full-stack).
*   **Database:** PostgreSQL (Ideal para relaciones de torneos y JSONB para el log de eventos).

### Flujo de Datos (Event-Driven)
`Control Center (UI)` ➔ `POST /events` ➔ `EventLog (Tabla)` ➔ `EventProcessor (Worker)` ➔ `ReadModels (Tablas Stats)` ➔ `Game Center (UI)`

---

## 🗂️ 3. Estructura de Carpetas

Usaremos **Feature-Sliced Design** para mantener la plataforma escalable y evitar que el Control Center se mezcle con el Game Center.

```text
/src
  /app                  # Punto de entrada, Providers, Router principal
  /assets               # Fuentes (Inter), Logos, Íconos
  /core                 # Dominio base
    /database           # Schema de DB, migraciones, ORM config
    /design-system      # Componentes UI puros (Botones, Tarjetas, Tipografía)
  /modules
    /control-center     # [Privado] Experiencia de la mesa de control
      /components       # UI específica (POS Keypad, Timeline Editor)
      /hooks            # Lógica Offline-first, Event Emitter
      /views            # Pantallas (MatchSetup, LiveDesk, MatchSummary)
    /game-center        # [Público] Experiencia Apple/Sofascore
      /components       # PlayerCards, StandingsTable, LiveScoreHeader
      /views            # Pantallas (Home, Match, Player, Team, Standings)
  /shared               # Tipos TS, utilidades, helpers de fechas
```

---

## 💽 4. Base de Datos (Schema Lógico)

**Tablas Core (Relacionales):**
*   `League`, `Season`, `Team`, `Player`
*   `Roster` (Team + Player + Season)
*   `Match` (HomeTeam, AwayTeam, Season, Status, Date)
*   `MatchPlayer` (Los 12 convocados para el partido)

**La Verdad Absoluta (Event Sourcing):**
*   `MatchEvent`: `id`, `match_id`, `timestamp`, `period`, `clock`, `type` (ej: `PTS_3`, `FOUL_P`, `TIMEOUT`), `primary_player_id`, `secondary_player_id`, `payload` (JSON).

**Modelos de Lectura (Projections - Auto-calculadas):**
*   `MatchStat`: Estadísticas de un jugador en un partido específico.
*   `SeasonStat`: Agregado de estadísticas de un jugador en una temporada.
*   `TeamStanding`: Posición, W/L, puntos a favor/contra.

---

## 📱 5. Flujos de Usuario

### Flujo: Mesa de Control (Match Day)
1.  **Setup:** Seleccionar Partido ➔ Validar Roster Local (On/Off) ➔ Validar Roster Visita (On/Off) ➔ Confirmar Quintetos Iniciales ➔ `START`.
2.  **Live Desk:** Pantalla dividida. Izquierda (Local), Derecha (Visita). Centro (Reloj y Marcador). Operador presiona `[+2]` ➔ `[Jugador 5]`. El marcador se actualiza instantáneamente.
3.  **Corrección:** Botón `[Deshacer]` revierte el último evento. Timeline lateral permite borrar un evento de hace 5 minutos (el sistema recalcula automáticamente).
4.  **End:** Finalizar partido ➔ Firma digital del árbitro ➔ Cierre de actas.

### Flujo: Fanático (Game Center)
1.  **Home (¿Qué pasa hoy?):** Hero banner con el partido en vivo (marcador grande, pulsando en rojo). Debajo: Partidos anteriores (tarjetas minimalistas).
2.  **Match Detail (¿Qué está ocurriendo?):**
    *   *Tab 1: Summary.* Gráfico de inercia (quién va ganando momento a momento), Líderes del partido.
    *   *Tab 2: Box Score.* Estadísticas limpias.
    *   *Tab 3: Timeline.* Lista de eventos estilo Twitter/X, cronológica.
3.  **Player Profile (¿Cómo ha jugado?):** Foto del jugador recortada en fondo oscuro. Estadísticas clave gigantes (PPG, RPG, APG). Gráfico de radar comparativo vs promedio de la liga.

---

## 🚦 6. Estados del Sistema (Match Status)

El motor de la app gira en torno al estado del partido:
`SCHEDULED` ➔ `WARMUP` ➔ `Q1` ➔ `BREAK` ➔ `Q2` ➔ `HALF_TIME` ➔ `Q3` ➔ `BREAK` ➔ `Q4` ➔ `OVERTIME` ➔ `FINISHED` ➔ `ABANDONED`

---

## 🎨 7. Design System (El "Apple x Sofascore Feel")

*   **Tema:** Dark Mode First. Sensación premium de cine o transmisión en vivo.
*   **Fondo:** Azul casi negro (`#0A0F1C`). Nunca negro puro (`#000000`).
*   **Superficies (Cards):** Blancos translúcidos (`rgba(255,255,255, 0.05)`) con *backdrop-blur* (Glassmorphism sutil) y bordes de `1px solid rgba(255,255,255, 0.1)`.
*   **Acentos:** Azul Eléctrico (`#0066FF`) para enlaces/primarios. Naranja Básquet (`#FF5722`) para estados "En Vivo" o alertas. Blanco (`#FFFFFF`) para texto principal.
*   **Tipografía:** `Inter`. Pesos muy contrastados. Títulos en `Bold` con *tracking* (espaciado) negativo. Datos numéricos en `SemiBold` monoespaciado (tabular figures) para que los marcadores no salten.
*   **Bordes y Sombras:** Radios altos (`rounded-2xl` o `rounded-3xl`). Sin sombras duras, solo resplandores suaves (glows) para elementos activos.

---

## 🧩 8. Componentes Reutilizables Core

1.  **`LiveScoreCard`**: Tarjeta ancha con logos de equipos, marcador en tipografía enorme, y un punto naranja titilando (`motion.div` de Framer Motion) indicando el cuarto y reloj.
2.  **`StatPill`**: Pequeña cápsula gris oscura `[ PTS 24 ]`. Minimalista, sin labels innecesarios.
3.  **`TimelineEvent`**: Fila con icono circular (Ej: aro naranja para canasta, silbato gris para falta), texto conciso ("A. Pérez anota de 3") y el reloj de juego ("Q2 04:12") justificado a la derecha.
4.  **`ControlDeskButton`**: Botón gigantesco, optimizado para touch en tablets iPad. Alta respuesta táctil (animación al presionar).

---

## 🗺️ 9. Roadmap de Desarrollo

*   **Fase 1: Motor y Datos (Semanas 1-2).** Setup de la DB, Schema de Eventos, API Core y Tipado estricto.
*   **Fase 2: Control Center (Semanas 3-4).** Creación de la UI privada, lógica offline, despachador de eventos y cálculo de marcadores en vivo.
*   **Fase 3: Game Center Core (Semanas 5-6).** Home público, Detalle de partido en vivo y Box Scores.
*   **Fase 4: Perfiles y Analítica (Semanas 7-8).** Perfiles de jugadores, equipos, tablas de posiciones y líderes históricos.

---

## 🎯 10. Qué construir primero y por qué

**Lo primero que debemos construir es el `Event Log Engine` y un prototipo del `Control Center Desk`.**

*¿Por qué?*
Porque en la arquitectura que has diseñado, **los datos son el rey**. No podemos construir un "Game Center" público hermoso si no tenemos datos reales fluyendo.
Si intentamos diseñar la cara pública primero, terminaremos usando datos falsos (mock data), lo que nos llevará a diseñar pantallas que no soportarán la realidad del juego.

Al construir la máquina registradora de eventos primero, validamos de inmediato:
1. Si nuestra estructura de base de datos soporta todos los escenarios del básquetbol.
2. Si podemos recalcular el marcador y el Box Score a partir de un flujo de eventos en tiempo real.

Una vez que tengamos un partido simulado generando eventos, construir las pantallas de Apple/Sofascore encima de esa API será un ejercicio puro de diseño y fluidez.

---
*Revisa este documento. Si estás de acuerdo con los desafíos planteados (especialmente el uso de CQRS para la velocidad del Game Center) y la ruta trazada, dime "Aprobado" y comenzaré a generar la arquitectura de carpetas y el código fundacional.*
