# Arquitectura del Sistema – BarberFlow

## 1. Introducción

Este documento describe la arquitectura del sistema *BarberFlow*, una solución de automatización diseñada para optimizar la gestión de citas en barberías mediante flujos de trabajo automatizados.

La arquitectura del sistema permite gestionar reservas, notificaciones y análisis de datos utilizando herramientas modernas de automatización e integración de APIs.

---

# 2. Tipo de Arquitectura

BarberFlow utiliza una *arquitectura orientada a eventos (Event Driven Architecture)*.

En este modelo, los procesos del sistema se ejecutan cuando ocurre un evento específico, por ejemplo:

* un cliente agenda una cita
* un cliente cancela una reserva
* el sistema envía recordatorios automáticos

Este enfoque permite automatizar procesos y mejorar la eficiencia del sistema.

---

# 3. Componentes del Sistema

El sistema está compuesto por varios componentes que trabajan de forma integrada.

## 3.1 Cliente

El cliente es el usuario que desea reservar un servicio de barbería.

Funciones del cliente:

* registrarse e iniciar sesión
* reservar citas
* seleccionar horario disponible
* ver sus citas
* cancelar citas
* calificar el servicio después de la cita
* recibir notificaciones

---

## 3.2 Barbero

El barbero es el empleado que atiende las citas.

Funciones del barbero:

* iniciar sesión con su cuenta
* ver solo sus citas
* cambiar el estado de sus citas

---

## 3.3 Administrador

El administrador es quien gestiona la barbería.

Funciones del administrador:

* ver y gestionar todas las citas
* confirmar, completar o cancelar citas
* ver estadísticas y reportes del negocio

---

## 3.4 Frontend

El frontend corresponde a la interfaz web donde los usuarios interactúan con el sistema.

Funciones del frontend:

* mostrar los horarios libres de cada barbero
* capturar información del cliente
* guardar la cita en la base de datos
* avisar a n8n de cada cita nueva

El frontend está hecho con *React + Vite* y se despliega en *Railway*.

---

## 3.5 Backend

El backend del sistema está construido utilizando *n8n*, que funciona como un motor de automatización.

Funciones del backend:

* recibir avisos de la página mediante webhooks
* enviar confirmaciones y recordatorios de citas
* cancelar citas desde el enlace enviado por WhatsApp
* conectarse con la base de datos
* gestionar integraciones con servicios externos

---

## 3.6 Base de Datos

La base de datos almacena toda la información del sistema.

Datos almacenados:

* perfiles de usuarios
* barberos y sus horarios
* servicios y precios
* citas
* horarios ocupados
* recordatorios
* calificaciones
* registro de notificaciones enviadas

La base de datos es gestionada mediante *Firebase (Firestore), y las cuentas de usuario con **Firebase Authentication*.

---

## 3.7 Sistema de Notificaciones

El sistema utiliza *WhatsApp mediante Evolution API* para enviar notificaciones automáticas como:

* confirmación de citas
* recordatorios
* cancelaciones
* mensajes informativos

---

## 3.8 Sistema de Inteligencia Artificial

El sistema puede integrar *OpenAI* para generar análisis automáticos de ventas y reportes del negocio.

Esto permite al administrador comprender mejor el rendimiento de la barbería.

---

# 4. Flujo General del Sistema

El funcionamiento general del sistema sigue el siguiente flujo:

1. El cliente inicia sesión y abre el formulario de reservas.
2. El cliente elige servicio, barbero, fecha y hora.
3. La página guarda la cita en Firestore con estado "pendiente".
4. La página avisa a n8n mediante un webhook con el ID de la cita.
5. n8n lee la cita en Firestore y envía la confirmación por WhatsApp.
6. Antes de la cita, n8n envía recordatorios automáticos.
7. Si el cliente cancela, la hora queda libre y n8n avisa la cancelación por WhatsApp.

---

# 5. Diagramas del Sistema

Los diagramas utilizados para describir la arquitectura del sistema se encuentran en la carpeta:

/docs/diagrams

Diagramas incluidos:

* Diagrama de casos de uso (casos de uso.jpg)
* Diagrama del frontend (diagrama front.jpeg)
* Diagrama del backend (diagrama back.jpeg)
* Todos los diagramas en un solo archivo (diagramas.pdf)

---

# 6. Stack Tecnológico

Las tecnologías utilizadas en el proyecto son:

Frontend

* React + Vite + TypeScript
* Railway (despliegue)

Backend

* n8n

Base de datos

* Firebase (Firestore y Authentication)

Integraciones

* WhatsApp (Evolution API)
* OpenAI API

---

# 7. Ventajas de la Arquitectura

La arquitectura implementada ofrece varias ventajas:

* automatización de procesos
* escalabilidad del sistema
* integración con múltiples APIs
* reducción de trabajo manual
* mejora en la gestión del negocio

---

# 8. Futuras Mejoras

El sistema puede ampliarse con nuevas funcionalidades como:

* aplicación móvil
* sistema de pagos en línea
* análisis predictivo de clientes
* sistema de fidelización
* panel administrativo avanzado