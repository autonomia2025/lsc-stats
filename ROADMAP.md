# LSC Game Center - Roadmap (Vertical Slices)

Filosofía: **Feature Driven Development**.
Cada Sprint entrega una funcionalidad completa de punta a punta (UI, Estado, Navegación, Backend, DB). El Design System crecerá de forma orgánica a medida que construimos las pantallas reales.

---

## Sprint 1: Configuración Inicial, Temporadas y Equipos (Backoffice)
*   **Objetivo:** Permitir al administrador estructurar la base de la liga, priorizando una experiencia de primer uso impecable.
*   **Features:**
    *   Autenticación de Administrador.
    *   **Asistente de Configuración Inicial (Setup Wizard):** Flujo de 5 pasos para el primer ingreso (Liga, Temporada, Equipos).
    *   Dashboard privado.
    *   Crear/Listar Temporadas.
    *   Crear/Listar Equipos (Nombre, Logo básico).
*   **Design System emergente:** Layout Wizard/Onboarding, Layout Administrador, Data Table simple, Formularios, inputs de texto, botones primarios/secundarios.
*   **Arquitectura:** Detección de base de datos limpia (`leagues == 0`), Modelos DB (Temporada, Equipo), API endpoints CRUD.

---

## Sprint 2: Roster y Programación (Backoffice)
*   **Objetivo:** Poblar los equipos con jugadores y armar el calendario de partidos.
*   **Features:**
    *   Gestor de Jugadores (Crear perfiles, asignar a equipos).
    *   Programación de Partidos (Crear un Match asignando Equipo Local, Equipo Visita, Fecha y Horario).
*   **Design System emergente:** Componentes selectores (Dropdowns) con búsqueda, Date/Time pickers, Listas dinámicas.
*   **Arquitectura:** Modelos DB (Jugador, Partido), relaciones complejas.

---

## Sprint 3: Control Center (El Motor de la Mesa)
*   **Objetivo:** La mesa puede registrar un partido en vivo mediante eventos inmutables de forma ultra-rápida.
*   **Features:**
    *   Selección del partido a oficiar.
    *   Confirmación de Roster (Convocados) de ambos equipos.
    *   Pantalla de POS (Point of Sale) en Vivo.
    *   Registro de eventos inmutables en la base de datos (+1, +2, +3, Faltas, Tiempos Muertos).
    *   Gestión de Cuartos y Reloj.
    *   Botón de "Deshacer" (Anulación de último evento).
    *   Finalizar partido.
*   **Design System emergente:** Layout POS fullscreen (optimizado para tablet), Botones Táctiles de Alta Respuesta, Reloj digital gigante, Timeline editable de eventos.
*   **Arquitectura:** Event Sourcing Engine, API Endpoint de inyección de eventos.

---

## Sprint 4: Game Center Core (Público - Tiempo Real)
*   **Objetivo:** El público puede consumir los partidos en vivo generados por la mesa.
*   **Features:**
    *   Home Pública (Game Center): Listado de partidos del día.
    *   Match Hub: Marcador en vivo (Live Score).
    *   Match Hub: Timeline de eventos en vivo.
    *   Match Hub: Box Score básico (calculado dinámicamente desde el Event Log).
*   **Design System emergente:** Layout Público (Professional Polish), LiveScoreCard, TimelineEvent, Tablas limpias de Box Score.
*   **Arquitectura:** Suscripciones Real-time (WebSockets/SSE), Proyectores de estado de partido.

---

## Sprint 5: Ecosistema y Jerarquía
*   **Objetivo:** Contexto histórico y competitivo global de la liga.
*   **Features:**
    *   Tabla de Posiciones (Standings) calculada a partir de los partidos finalizados.
    *   Ranking de Líderes (Goleadores del torneo).
    *   Perfiles de Equipos (Roster, Resumen de Partidos jugados).
*   **Design System emergente:** Tarjetas de jugador (Player Cards), Data Grids avanzados, Componentes de Filtrado.
*   **Arquitectura:** Materialized Views/Caché para las tablas de posiciones y líderes históricos (Performance optimizada).

---

## Sprint 6: Expansión de Perfiles Individuales
*   **Objetivo:** Construir la identidad digital y el portafolio del jugador.
*   **Features:**
    *   Perfiles de Jugador (Promedios, historial de partidos recientes).
*   **Design System emergente:** Gráficos de radar/barras, Hero section de jugador, Badges.
*   **Arquitectura:** Query optimizations para el cálculo acumulado histórico de cada jugador.
