# 💈 BarberFlow – Automatización para Barberías

## 📌 Descripción del Proyecto

BarberFlow es un sistema de automatización diseñado para optimizar la gestión de citas en barberías mediante el uso de flujos automatizados. El sistema permite a los clientes agendar citas de manera rápida y sencilla mientras que los administradores pueden gestionar la agenda, recibir notificaciones y analizar estadísticas de ventas.

El proyecto utiliza herramientas modernas de automatización para mejorar la organización del negocio, reducir el trabajo manual y ofrecer una mejor experiencia tanto para los clientes como para los administradores.

---

# 🚨 Problema

Actualmente muchas barberías gestionan sus citas de manera manual mediante:

* mensajes de WhatsApp
* llamadas telefónicas
* agendas físicas

Esto puede generar varios problemas como:

* pérdida de citas
* desorganización en la agenda
* clientes que olvidan su turno
* dificultad para analizar las ventas del negocio

---

# 💡 Solución

BarberFlow propone una solución basada en automatización que permite:

* agendar citas de forma automática
* enviar confirmaciones de citas
* enviar recordatorios antes de la cita
* permitir cancelaciones de citas
* generar estadísticas y reportes del negocio

Esto ayuda a mejorar la eficiencia del negocio y la experiencia del cliente.

---

# 🏗 Arquitectura del Sistema

El sistema está basado en una arquitectura de automatización orientada a eventos.

Cuando ocurre una acción como la creación de una cita o una cancelación, el sistema ejecuta automáticamente un flujo de trabajo que gestiona las notificaciones, actualiza la base de datos y procesa la información necesaria.

El motor principal de automatización del sistema es n8n que actúa como orquestador de los procesos.

---

# ⚙️ Stack Tecnológico

Frontend

* Aplicación web desplegada en Vercel

Backend

* Automatización mediante n8n

Base de Datos

* Gestión de datos mediante Firebase (Firestore)

Integraciones

* API de WhatsApp para envío de notificaciones
* IA mediante OpenAI para análisis de ventas

Control de versiones

* Git
* GitHub

---

# 🖥 Frontend: cómo correrlo

La app web está en `frontend/` (Vite + React + TypeScript + Tailwind CSS). Requiere Node 24 (ver `.nvmrc`).

```bash
cd barberflow
cp .env.example .env   # completa las variables
npm install
npm run dev            # http://localhost:3000
npm run check          # typecheck + lint + pruebas + build
```

Las cuentas, roles y permisos usan **Firebase Authentication** y las reglas de Firestore. Diseño, reglas y datos de prueba están en [backend/firebase/DISENO.md](backend/firebase/DISENO.md). Antes de usarlo: activa Correo/contraseña en Authentication, carga el seed (`npm run seed` en `firebase/`) y publica las reglas (`firebase deploy --only firestore:rules,firestore:indexes`).

Más detalle de las pruebas en [docs/TESTING.md](docs/TESTING.md).

---

# 🔄 Flujo del Sistema

1. El cliente accede a la página web.
2. El cliente agenda una cita mediante un formulario.
3. Los datos se envían al sistema mediante un webhook.
4. n8n recibe la solicitud y procesa la información.
5. La cita se guarda en la base de datos.
6. El cliente recibe una confirmación por WhatsApp.
7. Antes de la cita el sistema envía recordatorios automáticos.
8. El administrador puede visualizar estadísticas y reportes desde un dashboard.

---

# 📊 Funcionalidades del Sistema

✔ Agendamiento automático de citas
✔ Cancelación de citas
✔ Confirmaciones automáticas
✔ Recordatorios de citas
✔ Notificaciones por WhatsApp
✔ Dashboard de estadísticas
✔ Reportes automáticos del negocio

---

# 📈 Impacto del Proyecto

Este sistema permite a las barberías:

* mejorar la organización de la agenda
* reducir cancelaciones o citas olvidadas
* automatizar procesos administrativos
* analizar el rendimiento del negocio

---

# 🚀 Futuras Mejoras

En futuras versiones del sistema se podrían implementar:

* aplicación móvil
* sistema de pagos en línea
* análisis predictivo de clientes
* programa de fidelización

---

# 👨‍💻 Autor

John Zuluaga
Estudiante de Desarrollo de Software
Medellín – Colombia
2026
