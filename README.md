# ITSYSTEMS Academic Advisor - Documentación Técnica

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Arquitectura](#2-arquitectura)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Casos de Uso](#4-casos-de-uso)
5. [Costos del Modelo de IA](#5-costos-del-modelo-de-ia)
6. [Roadmap de Desarrollo](#6-roadmap-de-desarrollo)
7. [Guía de Configuración](#7-guía-de-configuración)
8. [API Reference](#8-api-reference)

---

## 1. Visión General

### 1.1 Descripción del Proyecto

El **ITSYSTEMS Academic Advisor** es un chatbot inteligente diseñado para orientar a estudiantes y profesionales sobre los cursos de SAP disponibles en la plataforma educativa de ITSYSTEMS. El sistema actúa como un asesor académico virtual que guía a los usuarios a través del catálogo de cursos, sugiere rutas de aprendizaje personalizadas y automatiza el proceso de inscripción mediante integración directa con SAP.

El proyecto surgió como una necesidad de escalar la capacidad de atención al cliente de ITSYSTEMS, permitiendo que estudiantes potenciales obtengan información sobre cursos sin intervención humana directa, mientras el sistema aprende y mejora continuamente las respuestas basadas en el catálogo oficial de cursos.

### 1.2 Objetivos del Proyecto

**Objetivo Principal:**
Proporcionar un asesor académico virtual 24/7 que pueda interactuar con estudiantes, responder preguntas sobre cursos, diseñar rutas de estudio personalizadas y gestionar el proceso de inscripción en SAP de manera automatizada.

**Objetivos Específicos:**
- Reducir el tiempo de respuesta de atención al cliente de horas a segundos
- Aumentar la tasa de conversión de prospectos a estudiantes inscritos
- Proporcionar información consistente y actualizada sobre todos los cursos
- Personalizar la experiencia de aprendizaje sugiriendo rutas optimizadas
- Automatizar el registro de usuarios en el sistema SAP backend

### 1.3 Alcance

| Incluido | Excluido |
|----------|----------|
| Chatbot conversacional con IA | Plataforma de pago integrada |
| Catálogo de cursos dinámico | Generación de certificados |
| Rutas de estudio personalizadas | Seguimiento de progreso académico |
| Integración con SAP para registro | Portal de estudiante con notas |
| Historial de conversaciones por sesión | Videoconferencias o clases en vivo |
| Filtro de cursos por categoría | Soporte multilingüe (v1) |

---

## 2. Arquitectura

### 2.1 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTES                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Web App   │  │   Mobile    │  │   Chatbot   │  │    API      │      │
│  │   (React)   │  │  (Flutter)  │  │  (WhatsApp) │  │   (3rd    )  │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS/REST
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Node.js + Express)                        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        API Gateway / Express                          │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │  Chat Routes │  │  SAP Routes  │  │  Auth Routes │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                          │
│  ┌─────────────────────────────────┼─────────────────────────────────────┐ │
│  │                                 ▼                                          │ │
│  │  ┌────────────────────────────────────────────────────────────────┐  │ │
│  │  │                      SERVICES LAYER                             │  │ │
│  │  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────┐ │  │ │
│  │  │  │ LLM Service│  │  Memory    │  │    SAP     │  │   DB    │ │  │ │
│  │  │  │  (Gemini)  │  │  Service   │  │  Service   │  │ Service │ │  │ │
│  │  │  └────────────┘  └────────────┘  └────────────┘  └─────────┘ │  │ │
│  │  └────────────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
          │                       │                    │                  │
          ▼                       ▼                    ▼                  ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Gemini API     │   │  PostgreSQL     │   │   SAP S/4HANA  │   │  File System    │
│  (Google AI)   │   │  (Sessions)    │   │   (Cloud)      │   │  (catalogo.json) │
│                 │   │                 │   │                 │   │                 │
│  - generateContent   │  - sesiones.json │   │  - OData FI/PP │   │  - Catálogo     │
│  - embeddings   │   │  - user_sessions│   │  - OData MM/SD │   │  - Cursos       │
│  (futuro)       │   │                 │   │  - OData PM    │   │  - Perfiles     │
└─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘
```

### 2.2 Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE UNA CONVERSACIÓN TÍPICA                     │
└─────────────────────────────────────────────────────────────────────────────┘

  1. USUARIO ENVÍA MENSAJE
     "Cuánto dura el curso de SAP MM?"
           │
           ▼
  2. EXPRESS RECIBE REQUEST
     POST /api/chat
     { sessionId: "abc123", message: "Cuánto dura el curso de SAP MM?" }
           │
           ▼
  3. MEMORY SERVICE
     - Verifica si existe sesión "abc123"
     - Carga historial de mensajes previos
     - Agrega nuevo mensaje del usuario
           │
           ▼
  4. LLM SERVICE (filtrado por categoría)
     - detectCategory() → "specific" → ["sap-mm"]
     - Filtra catálogo: solo incluye SAP MM
     - Construye systemPrompt con reglas + contexto filtrado
     - Envía a Gemini API
           │
           ▼
  5. GEMINI PROCESA
     - Modelo: gemini-3.5-flash-lite
     - Max tokens: 500
     - Temperature: 0.7
           │
           ▼
  6. RESPUESTA RECIBIDA
     "El curso de SAP MM tiene una duración de 35 horas,
      distribuidas en modalidad virtual asíncrona."
           │
           ▼
  7. MEMORY SERVICE
     - Agrega respuesta del asistente a la sesión
     - Guarda sesión actualizada
           │
           ▼
  8. RESPONSE AL CLIENTE
     { reply: "...", limitReached: false }
```

### 2.3 Arquitectura de Componentes

#### Backend (src/)
```
src/
├── server.ts              # Punto de entrada, configuración de Express
├── config.ts              # Variables de entorno y configuración global
├── controllers/
│   ├── chat.controller.ts # Maneja requests de chat
│   └── sap.controller.ts  # Maneja requests de SAP
├── routes/
│   ├── chat.routes.ts     # Rutas de chat (/api/chat)
│   └── sap.routes.ts      # Rutas de SAP (/api/sap/*)
├── services/
│   ├── llm.service.ts     # Integración con Gemini API
│   ├── memory.service.ts   # Gestión de sesiones y historial
│   ├── sap.service.ts     # Integración con SAP OData
│   └── db.service.ts       # Conexión a PostgreSQL (reservado)
└── types/
    └── index.ts           # Definición de tipos TypeScript
```

#### Frontend (próximo)
```
src/
├── App.tsx
├── components/
│   ├── ChatWindow.tsx
│   ├── MessageBubble.tsx
│   ├── CourseCard.tsx
│   └── RouteDisplay.tsx
├── pages/
│   ├── Home.tsx
│   └── CourseCatalog.tsx
├── hooks/
│   ├── useChat.ts
│   └── useSession.ts
└── services/
    └── api.ts
```

---

## 3. Stack Tecnológico

### 3.1 Backend

| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| Runtime | Node.js | 20.x LTS | Entorno de ejecución |
| Framework | Express.js | 4.21.x | Servidor HTTP y routing |
| Lenguaje | TypeScript | 5.5.x | Tipado estático |
| Runtime dev | ts-node | 10.9.x | Ejecución directa de TS |

### 3.2 Base de Datos

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| BD Principal | PostgreSQL | Sesiones, logs, métricas |
| Sesiones | JSON file (v1) | Almacenamiento temporal de conversaciones |
| Catálogo | JSON file | Fuente de datos de cursos (sin estructura vectorial) |

**Nota:** La versión actual usa archivos JSON para sesiones. En producción se recomienda migrar a PostgreSQL para mejor escalabilidad y persistencia.

### 3.3 Inteligencia Artificial

| Componente | Tecnología | Proveedor |
|------------|------------|-----------|
| LLM Principal | Gemini 3.5 Flash-Lite | Google AI |
| LLM (anterior) | Ollama + Llama 3.1 | Local |
| Embeddings (futuro) | Gemini Embeddings | Google AI |
| Vector Store (futuro) | pgvector | PostgreSQL extension |

### 3.4 Integraciones

| Servicio | Protocolo | Descripción |
|----------|-----------|-------------|
| SAP S/4HANA (FI/PP) | OData REST | Sistema original de registro |
| SAP S/4HANA (MM/SD/PM) | OData REST | Sistema nuevo de registro |

### 3.5 Seguridad

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| CORS | express-cors | Control de acceso cruzado |
| HTTPS | Proxy reverso | Encriptación en tránsito |
| API Key | Environment variable | Autenticación con Gemini |
| Rate Limiting | Por implementar | Prevención de abuse |

---

## 4. Casos de Uso

### 4.1 CU-001: Consulta de Información de Curso

**Actor:** Estudiante potencial
**Precondición:** El estudiante tiene una pregunta sobre un curso específico
**Postcondición:** El estudiante recibe información precisa sobre el curso

**Flujo Principal:**
1. Estudiante pregunta sobre duración, prerrequisitos o contenido de un curso
2. Sistema detecta la categoría (SAP FI, MM, SD, ABAP, CAP)
3. Sistema filtra el catálogo para incluir solo ese curso
4. LLM genera respuesta con información del curso
5. Respuesta se muestra al estudiante

**Flujo Alternativo:**
- Si el curso no existe en el catálogo, el sistema indica que no maneja ese tema

### 4.2 CU-002: Diseño de Ruta de Estudio

**Actor:** Estudiante que no sabe por dónde empezar
**Precondición:** El estudiante expresa interés en aprender SAP pero no conoce el camino
**Postcondición:** El estudiante recibe una ruta de aprendizaje personalizada

**Flujo Principal:**
1. Estudiante pregunta sobre perfiles o rutas de estudio
2. Sistema detecta keywords de perfil ("perfil Consultor Funcional", "ruta")
3. Sistema carga todos los cursos relevantes al perfil
4. LLM presenta los cursos en orden recomendado con justificaciones
5. Estudiante puede confirmar o pedir más detalles

**Regla de Negocio:**
> El sistema NUNCA debe mostrar la ruta completa en la primera respuesta. Debe esperar confirmación explícita del usuario antes de presentar la ruta secuencial.

### 4.3 CU-003: Consulta sobre Mercado Laboral

**Actor:** Estudiante curioso sobre oportunidades profesionales
**Precondición:** El estudiante pregunta sobre demanda, salarios o requerimientos del mercado
**Postcondición:** El sistema responde con conocimiento general (sin catálogo)

**Flujo Principal:**
1. Estudiante pregunta sobre mercado laboral, demanda o requerimientos
2. Sistema detecta keywords de mercado ("demanda", "trabajo", "sueldo")
3. Sistema NO envía catálogo al LLM
4. LLM responde con conocimiento general del sector

**Nota de Diseño:**
Este caso de uso utiliza el conocimiento general del modelo en lugar del catálogo, permitiendo respuestas más contextualizadas sobre tendencias del mercado.

### 4.4 CU-004: Registro Automatizado en SAP

**Actor:** Estudiante que desea inscribirse
**Precondición:** El estudiante proporcionó un nombre de usuario válido
**Postcondición:** El usuario queda registrado en SAP con el rol correspondiente

**Flujo Principal:**
1. Estudiante expresa interés en inscribirse
2. Sistema solicita confirmación de usuario
3. Estudiante proporciona usuario (ej: "juan.perez")
4. Sistema valida formato de usuario
5. Sistema llama a SAP Service para registrar
6. SAP crea usuario con rol del curso seleccionado
7. Sistema confirma inscripción al estudiante

**Manejo de Errores:**
- Si SAP no responde: mensaje genérico de error + opción de reintento
- Si el usuario ya existe: SAP retorna error específico que se traduce a mensaje amigable

### 4.5 CU-005: Recuperación de Sesión

**Actor:** Estudiante que regresa al chat
**Precondición:** El estudiante tiene una sesión previa guardada
**Postcondición:** El sistema recupera el historial de conversación

**Flujo Principal:**
1. Estudiante envía mensaje con sessionId existente
2. Sistema carga historial de sesiones
3. Sistema reconstruye contexto con historial completo
4. LLM genera respuesta considerando historial previo
5. Conversación continúa naturalmente

---

## 5. Costos del Modelo de IA

### 5.1 Modelos Disponibles y Precios

| Modelo | Input ($/1M tokens) | Output ($/1M tokens) | Disponibilidad |
|--------|---------------------|---------------------|----------------|
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | ❌ Bloqueado para nuevos usuarios |
| Gemini 3.1 Flash-Lite | $0.25 | $1.50 | ✅ Disponible |
| Gemini 3.5 Flash-Lite | $0.30 | $2.50 | ✅ **En uso** |
| Gemini 3.6 Flash | $0.75 | $3.75 | ✅ Disponible |
| Gemini 3.7 Flash | $0.75 | $3.75 | ✅ Disponible |

### 5.2 Estimación de Costos por Volumen

**Parámetros de cálculo:**
- Tokens promedio por mensaje de entrada: ~500 (con filtrado por categoría)
- Tokens promedio por respuesta: ~200 (maxOutputTokens: 500)
- Sesión típica: 6 mensajes (3 usuario + 3 asistente)

| Volumen | msgs/mes | Tokens input/mes | Tokens output/mes | Costo total/mes |
|---------|----------|------------------|-------------------|-----------------|
| Personal | 500 | 250,000 | 100,000 | **$0.18** |
| Pequeño | 1,000 | 500,000 | 200,000 | **$0.35** |
| Mediano | 10,000 | 5,000,000 | 2,000,000 | **$3.50** |
| Grande | 50,000 | 25,000,000 | 10,000,000 | **$17.50** |
| Enterprise | 100,000 | 50,000,000 | 20,000,000 | **$35.00** |

### 5.3 Comparativa: Ollama vs Gemini

| Aspecto | Ollama (local) | Gemini (API) |
|---------|----------------|--------------|
| Costo | $0 (infraestructura propia) | $3-35/mes según volumen |
| HW requerido | GPU dedicada | Solo internet |
| Latencia | ~100-500ms | ~500-2000ms |
| Calidad | Buena | Excelente |
| Mantenimiento | Alto | Bajo |
| Disponibilidad | 24/7 (si el server está encendido) | Siempre disponible |

**Recomendación:** Mantener Ollama como fallback para desarrollo/testing, usar Gemini para producción.

### 5.4 Optimización de Costos

**Estrategias implementadas:**
1. **Filtrado por categoría**: Reduce tokens de entrada en ~70-90%
2. **Historial limitado**: Solo 6 mensajes por request
3. **maxOutputTokens: 500**: Previene respuestas excesivamente largas

**Estrategias futuras:**
1. **RAG con pgvector**: Reducirá aún más los tokens de entrada
2. **Caching de respuestas**: Para preguntas frecuentes
3. **Batch processing**: Para métricas agregadas

---

## 6. Roadmap de Desarrollo

### 6.1 Fase 1: MVP Estabilizado (Completado ✅)

**Objetivo:** Tener el chatbot básico funcionando en producción

| Hito | Estado | Descripción |
|------|--------|-------------|
| H1.1 | ✅ | Integración con Gemini API |
| H1.2 | ✅ | Sistema de sesiones con memoria |
| H1.3 | ✅ | Filtrado de cursos por categoría |
| H1.4 | ✅ | Integración con SAP para registro |
| H1.5 | ✅ | Reglas del agente simplificadas |

### 6.2 Fase 2: Optimización (Q3 2026)

**Objetivo:** Reducir costos y mejorar rendimiento

```
┌─────────────────────────────────────────────────────────────┐
│                    FASE 2: OPTIMIZACIÓN                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  2.1 RAG Implementation (Mes 1)                              │
│  ├── Instalar pgvector en PostgreSQL                        │
│  ├── Generar embeddings de cursos                           │
│  ├── Implementar búsqueda vectorial                          │
│  └── Migrar llm.service.ts a RAG                           │
│                                                              │
│  2.2 Métricas y Monitoring (Mes 2)                          │
│  ├── Integrar dashboard de métricas                          │
│  ├── Implementar logging estructurado                        │
│  ├── Alertas de costos y errores                            │
│  └── Analytics de conversaciones                            │
│                                                              │
│  2.3 Optimización de Prompts (Mes 2)                        │
│  ├── A/B testing de prompts                                  │
│  ├── Refinar reglas del agente                              │
│  └── Evaluar calidad de respuestas                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Fase 3: Seguridad y Autenticación (Q4 2026)

**Objetivo:** Implementar capa de seguridad robusta

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| Rate Limiting | Alta | Limitar requests por IP (100/min) |
| Autenticación SMS | Alta | Login con OTP por celular |
| WhatsApp Integration | Media | Canal alternativo de atención |
| WAF Setup | Media | Cloudflare o similar |
| API Key Rotation | Baja | Rotación automática de API keys |
| Audit Logs | Media | Registro de todas las operaciones |

### 6.4 Fase 4: Experiencia de Usuario (Q1 2027)

**Objetivo:** Mejorar UI/UX y features avanzadas

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| Frontend Web | Alta | Aplicación web completa |
| Dark Mode | Baja | Tema oscuro para el chat |
| Course Cards | Media | Mostrar cursos como tarjetas |
| Progress Tracker | Media | Seguir avance del usuario |
| Multi-session | Baja | Soporte múltiples conversaciones |

### 6.5 Fase 5: Escalamiento (Q2 2027)

**Objetivo:** Escalar a más usuarios y funcionalidades

| Feature | Prioridad | Descripción |
|---------|-----------|-------------|
| App Móvil | Alta | React Native o Flutter |
| Soporte Multilingüe | Media | Español e inglés inicial |
| Integración Pagos | Alta | PayPal, Stripe, MercadoPago |
| LMS Integration | Baja | Moodle, Canvas, Blackboard |

### 6.6 Timeline Visual

```
2026                    2027
   Q1   Q2   Q3   Q4      Q1   Q2
   ──────  ──────  ──────  ──────  ──────
   │FASE 1│FASE 2│FASE 3│FASE 4│FASE 5│
   ──────  ──────  ──────  ──────  ──────
   ✅ MVP  →  RAG  →  Auth  →  UX   → Scale
```

---

## 7. Guía de Configuración

### 7.1 Variables de Entorno

```env
# ============================================
# CONFIGURACIÓN DEL SERVIDOR
# ============================================
PORT=3000

# ============================================
# CONFIGURACIÓN DE GEMINI (AI)
# ============================================
# API Key de Google AI Studio
GEMINI_API_KEY=tu_api_key_de_google_ai_studio

# Modelo a utilizar
# Opciones: gemini-3.5-flash-lite, gemini-3.6-flash, gemini-3.7-flash
GEMINI_MODEL=gemini-3.5-flash-lite

# Límite de tokens en respuesta (150-800 recomendado)
GEMINI_MAX_TOKENS=500

# Temperatura (0.0-1.0, menor = más determinista)
GEMINI_TEMPERATURE=0.7

# Cantidad de mensajes de historial a enviar
GEMINI_MAX_HISTORY=6

# ============================================
# CONFIGURACIÓN DE SAP (OData)
# ============================================
# URL del servicio OData (sistema original FI/PP)
SAP_BASE_URL=https://tu-servidor-sap.com:443

# URL del servicio OData (sistema nuevo MM/SD/PM)
SAP_ODATA_MAT_URL=https://tu-servidor-sap.com:443

# Credenciales de usuario técnico SAP
SAP_USER=tu_usuario_sap
SAP_PASSWORD=tu_password_sap

# Cliente SAP
SAP_CLIENT=300

# ============================================
# CONFIGURACIÓN DE BASE DE DATOS (PostgreSQL)
# ============================================
DB_USER=tu_usuario_db
DB_PASSWORD=tu_password_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ag_itsystems
```

### 7.2 Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd ITSYSTEMS\ -\ Agente

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar en desarrollo
npm run dev

# Build para producción
npm run build

# Ejecutar en producción
npm start
```

### 7.3 Verificación del Servidor

```bash
# Health check
curl http://localhost:3000/health

# Respuesta esperada:
# {"status":"ok","timestamp":"2026-08-21T..."}
```

### 7.4 Testing del Chat

```bash
# Test básico de chat
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-001", "message":"Hola, qué cursos ofrecen?"}'

# Test con pregunta de mercado
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-002", "message":"SAP FI es requerido en el mercado?"}'

# Test de pregunta específica
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test-003", "message":"Cuánto dura el curso de SAP MM?"}'
```

---

## 8. API Reference

### 8.1 Endpoints

#### GET /health

Verifica que el servidor esté corriendo.

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-21T10:30:00.000Z"
}
```

#### POST /api/chat

Envía un mensaje al chatbot y recibe una respuesta.

**Request:**
```json
{
  "sessionId": "usuario-123",
  "message": "Cuánto dura el curso de SAP FI?"
}
```

**Respuesta:**
```json
{
  "reply": "El curso de SAP FI tiene una duración de 40 horas, distribuidas en modalidad virtual asíncrona. Está diseñado para estudiantes de nivel intermedio que quieran convertirse en consultores funcionales SAP.",
  "limitReached": false
}
```

**Códigos de error:**
| Código | Descripción |
|--------|-------------|
| 200 | Solicitud exitosa |
| 400 | Faltan parámetros (sessionId o message) |
| 500 | Error interno del servidor |

#### POST /api/sap/registrar

Registra un usuario en SAP con un rol específico.

**Request:**
```json
{
  "username": "juan.perez",
  "roleId": "S4_MM_DEMO"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Registro exitoso",
  "statusCode": 200
}
```

**Roles disponibles:**
| Rol | Descripción | Sistema |
|-----|-------------|---------|
| S4_FI_DEMO | SAP FI - Financial Accounting | Original |
| S4_PP_DEMO | SAP PP - Production Planning | Original |
| S4_MM_DEMO | SAP MM - Material Management | Nuevo |
| S4_SD_DEMO | SAP SD - Sales and Distribution | Nuevo |
| S4_PM_DEMO | SAP PM - Plant Maintenance | Nuevo |

### 8.2 Estructura de Sesión

El sistema guarda sesiones en `sesiones.json`:

```json
{
  "usuario-123": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "¡Hola! Soy el asesor académico..." },
    { "role": "user", "content": "Cuánto dura SAP FI?" },
    { "role": "assistant", "content": "El curso dura 40 horas..." }
  ]
}
```

---

## Anexo A: Catálogo de Cursos

### A.1 Cursos Disponibles

### A.1 Catálogo de Cursos

#### Segmento SBO

| ID | Nombre | Modalidad | Precio (S/) |
|----|--------|-----------|---------------|
| sbo-b1-desarrollo-sdk-virtual | B1 DESARROLLO (SDK) | VIRTUAL | 1,700 |
| sbo-b1-implementacion-virtual | B1 IMPLEMENTACION | VIRTUAL | 1,400 |
| sbo-b1-contable-virtual | B1 CONTABLE | VIRTUAL | 1,200 |
| sbo-b1-administrativo-virtual | B1 ADMINISTRATIVO | VIRTUAL | 600 |
| sbo-b1-administrativo-online | B1 ADMINISTRATIVO | ONLINE | 600 |

#### Segmento S4 HANA

| ID | Nombre | Modalidad | Precio (S/) |
|----|--------|-----------|---------------|
| s4hana-mm-fi-pp-virtual | MM / FI / PP | VIRTUAL | 600 |
| s4hana-pm-virtual | PM | VIRTUAL | 700 |
| s4hana-co-ewm-virtual | CO / EWM | VIRTUAL | 700 |
| s4hana-qm-ps-ii-virtual | QM / PS / II | VIRTUAL | 900 |
| s4hana-sd-virtual | SD | VIRTUAL | 800 |
| s4hana-tm-virtual | TM | VIRTUAL | 1,400 |
| s4hana-mm-fi-pp-online | MM / FI / PP | ONLINE | 600 |
| s4hana-pm-online | PM | ONLINE | 700 |
| s4hana-sd-online | SD | ONLINE | 2,400 |
| s4hana-tm-online | TM | ONLINE | 1,000 |
| s4hana-ewm-ps-co-qm-online | EWM / PS / CO / QM | ONLINE | 800 |
| s4hana-mm-configuracion-online | MM CONFIGURACIÓN | ONLINE | 900 |

#### Segmento ECC

| ID | Nombre | Modalidad | Precio (S/) |
|----|--------|-----------|---------------|
| ecc-hcm-virtual | HCM | VIRTUAL | 600 |
| ecc-mm-pp-qm-wm-pm-sd-co-fi-virtual | MM/PP/QM/WM/PM/SD/CO/FI | VIRTUAL | 500 |

#### Segmento HANA TÉCNICO

| ID | Nombre | Modalidad | Precio (S/) |
|----|--------|-----------|---------------|
| hana-abap-virtual | ABAP | VIRTUAL | Por confirmar |
| hana-abap-online | ABAP | ONLINE | 1,100 |
| hana-abap-rap-virtual | ABAP RAP | VIRTUAL | Por confirmar |
| hana-abap-rap-online | ABAP RAP | ONLINE | 1,100 |
| hana-sql-online | SQL | ONLINE | Por confirmar |
| hana-hana-sql-virtual | HANA SQL | VIRTUAL | Por confirmar |
| hana-basis-virtual | BASIS | VIRTUAL | 1,750 |
| hana-basis-online | BASIS | ONLINE | Por confirmar |
| hana-basis-online-2 | BASIS | ONLINE | 2,400 |
| hana-fiori-online | FIORI | ONLINE | 2,400 |
| hana-btp-virtual | BTP | VIRTUAL | Por confirmar |
| hana-developer-btp-online | DEVELOPER BTP | ONLINE | Por confirmar |
| hana-hana-bd-online | HANA BD | ONLINE | 2,400 |
| hana-hana-bd-adm-virtual | HANA BD ADM | VIRTUAL | Por confirmar |
| hana-dev-fiori-s4-virtual | DEV. FIORI S4 | VIRTUAL | 2,220 |

#### Segmento PRODUCTIVIDAD

| ID | Nombre | Modalidad | Precio (S/) |
|----|--------|-----------|---------------|
| productividad-excel-soluciones-virtual | EXCEL SOLUCIONES EMPRESARIALES | VIRTUAL | 250 |
| productividad-taller-automatizacion-virtual | TALLER AUTOMATIZACION DE DATOS | VIRTUAL | 100 |
| productividad-contab-no-contadores-virtual | CONTAB. para no contadores | VIRTUAL | 250 |
| productividad-ia-empresarial-online | IA EMPRESARIAL | ONLINE | 518 |

### A.2 Perfiles de Carrera (14 perfiles)

| ID | Nombre | Descripción |
|----|--------|-------------|
| consultor-sbo | Consultor SAP Business One | Especialista en implementación y configuración de B1 |
| consultor-sbo-online | Consultor SAP Business One Online | Operaciones diarias de B1 con clases en vivo |
| consultor-s4hana | Consultor SAP S/4HANA | Especialista en módulos funcionales de S/4HANA (VIRTUAL) |
| consultor-s4hana-online | Consultor SAP S/4HANA Online | Especialista en módulos funcionales de S/4HANA (ONLINE) |
| desarrollador-hana-online | Desarrollador SAP HANA Online | Desarrollo ABAP, RAP, Fiori, BTP con clases en vivo |
| desarrollador-hana-virtual | Desarrollador SAP HANA Virtual | Desarrollo con acceso práctico al sistema |
| administrador-hana-online | Administrador SAP HANA Online | Administración Basis, SQL, HANA BD con clases en vivo |
| administrador-hana-virtual | Administrador SAP HANA Virtual | Administración con acceso práctico al sistema |
| consultor-ecc | Consultor SAP ECC | Especialista en sistema heredado ECC |
| consultor-productividad | Consultor de Productividad | Excel, automatización, contabilidad básica |
| consultor-productividad-online | Consultor de Productividad Online | IA Empresarial aplicada |
| consultor-tecnico-hibrido | Consultor Técnico Híbrido | Combina consultoría funcional S4HANA con habilidades técnicas |
| consultor-datos-empresariales | Consultor de Datos Empresariales | SQL HANA + Productividad + IA |
| consultor-automation-ai | Consultor de Automation y AI | Automatización + BTP + IA |

---

## Anexo B: Glosario

| Término | Definición |
|---------|------------|
| **RAG** | Retrieval Augmented Generation - técnica para mejorar respuestas de LLM con datos externos |
| **Embedding** | Representación vectorial de texto para búsqueda semántica |
| **OData** | Open Data Protocol - estándar REST para APIs de datos |
| **CSR** | Client-Side Rendering - renderizado en el navegador |
| **SSR** | Server-Side Rendering - renderizado en el servidor |
| **OTP** | One-Time Password - código de verificación de un solo uso |
| **WAF** | Web Application Firewall - firewall para aplicaciones web |

---

## Anexo C: Changelog

### v1.0.0 (2026-08-21)
- ✅ MVP completo
- ✅ Integración con Gemini API
- ✅ Filtrado por categoría
- ✅ Integración SAP (dual OData)
- ✅ Sistema de sesiones

---

*Documento generado automáticamente*
*Última actualización: Agosto 2026*
