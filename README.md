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

# 🏗️ Arquitectura del Sistema

El sistema está basado en una arquitectura de automatización orientada a eventos.

Cuando ocurre una acción como la creación de una cita o una cancelación, el sistema ejecuta automáticamente un flujo de trabajo que gestiona las notificaciones, actualiza la base de datos y procesa la información necesaria.

El motor principal de automatización del sistema es n8n que actúa como orquestador de los procesos.

---

# ⚙️ Stack Tecnológico

Frontend

* Aplicación web en React + Vite, desplegada en Railway

Backend

* Automatización mediante n8n

Base de Datos

* Gestión de datos mediante Firebase (Firestore)

Integraciones

* WhatsApp mediante Evolution API para envío de notificaciones
* IA mediante OpenAI para análisis de ventas

Control de versiones

* Git
* GitHub

---

# 🖥️ Cómo correr la aplicación

bash
cd frontend
npm install
npm run dev            # http://localhost:3000


Antes de la primera vez, copia frontend/.env.example como frontend/.env y completa los valores de Firebase y n8n.

### Configuración inicial de Firebase (solo una vez, ya está hecha)

Solo se necesita si se crea un proyecto de Firebase nuevo. Se hace dentro de backend/firebase/:

- npm run seed: carga barberos y servicios.
- firebase deploy --only firestore:rules,firestore:indexes: publica las reglas.
- npm run rol: asigna el rol de admin o barbero a una cuenta.

Diseño de la base de datos en [backend/firebase/DISENO.md](backend/firebase/DISENO.md). Pruebas en [docs/TESTING.md](docs/TESTING.md).

---

# 🔄 Flujo del Sistema

1. El cliente inicia sesión y abre el formulario de reservas.
2. El cliente elige servicio, barbero, fecha y hora.
3. La página guarda la cita en Firestore con estado "pendiente".
4. La página avisa a n8n mediante un webhook con el ID de la cita.
5. n8n envía la confirmación por WhatsApp.
6. Antes de la cita, n8n envía recordatorios automáticos.
7. El administrador puede visualizar estadísticas y reportes desde un dashboard.

---

# 📊 Funcionalidades del Sistema

✔️ Agendamiento automático de citas
✔️ Cancelación de citas
✔️ Confirmaciones automáticas
✔️ Recordatorios de citas
✔️ Notificaciones por WhatsApp
✔️ Dashboard de estadísticas
✔️ Reportes automáticos del negocio

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

# 👨‍💻 Autores

* John Zuluaga
* Simón Restrepo
* Johan Sebastián Palacios
* Juan Pablo Cartagena
* Nicolás Giraldo

Estudiantes de Desarrollo de Software
Medellín – Colombia
2026
