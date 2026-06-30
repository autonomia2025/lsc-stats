# LSC Game Center - Sprint 0: Foundation & Setup

Filosofía de desarrollo: **Vertical Slices (Feature Driven Development)**.
El Design System y la arquitectura crecerán orgánicamente a medida que las features de negocio lo requieran. No construiremos componentes aislados por adelantado.

Este Sprint 0 tiene un alcance mínimo y crítico: asegurar que el cascarón del proyecto compile, se despliegue y tenga la plomería base conectada.

## Tareas del Sprint 0

### 1. Inicialización del Proyecto
*   **Objetivo:** Entorno base configurado.
*   **Resultado esperado:** Linter, Formatter (ESLint/Prettier), alias de rutas (`@/`) y variables de entorno (`.env.example`) configurados.
*   **Criterios de Aceptación:** El proyecto compila y se sirve sin errores.

### 2. Configuración de Base de Datos y Auth
*   **Objetivo:** Conectar la persistencia de datos.
*   **Resultado esperado:** Proyecto conectado a la base de datos y proveedor de Autenticación inicializado.
*   **Criterios de Aceptación:** Las credenciales están configuradas de forma segura y el cliente de DB/Auth se inicializa correctamente sin romper la app.

### 3. Configuración del Tema Visual
*   **Objetivo:** Inyectar el ADN de diseño "Professional Polish".
*   **Resultado esperado:** Motor de estilos configurado con la paleta de colores de la liga (Azul profundo, eléctrico, naranja) y las tipografías (Inter, JetBrains Mono).
*   **Criterios de Aceptación:** Se puede renderizar un contenedor vacío con los colores y tipografías del tema correctamente en pantalla.

### 4. Router Base
*   **Objetivo:** Habilitar la navegación.
*   **Resultado esperado:** Enrutador configurado con un esqueleto mínimo.
*   **Criterios de Aceptación:** Renderiza un "Hello World" en `/` y soporta navegación básica sin rutas complejas.

### 5. Deploy Funcionante
*   **Objetivo:** Pipeline hacia producción.
*   **Resultado esperado:** La aplicación se despliega correctamente y es accesible mediante la infraestructura de AI Studio / Cloud Run.
*   **Criterios de Aceptación:** El build de producción se genera exitosamente.
