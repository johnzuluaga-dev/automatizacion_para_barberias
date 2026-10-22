# Arquitectura del Sistema – BarberFlow

## 1. Introducción

Este documento describe la arquitectura del sistema **BarberFlow**, una solución de automatización diseñada para optimizar la gestión de citas en barberías mediante flujos de trabajo automatizados.

La arquitectura del sistema permite gestionar reservas, notificaciones y análisis de datos utilizando herramientas modernas de automatización e integración de APIs.

---

# 2. Tipo de Arquitectura

BarberFlow utiliza una **arquitectura orientada a eventos (Event Driven Architecture)**.

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

* reservar citas
* seleccionar horario disponible
* cancelar citas
* recibir notificaciones

---

## 3.2 Frontend

El frontend corresponde a la interfaz web donde los clientes interactúan con el sistema.

Funciones del frontend:

* mostrar disponibilidad de horarios
* capturar información del cliente
* enviar solicitudes de citas al backend

El frontend puede desplegarse utilizando **Vercel**.

---

## 3.3 Backend

El backend del sistema está construido utilizando **n8n**, que funciona como un motor de automatización.

Funciones del backend:

* recibir solicitudes mediante webhooks
* ejecutar flujos de automatización
* conectarse con la base de datos
* gestionar integraciones con servicios externos

---

## 3.4 Base de Datos

La base de datos almacena toda la información del sistema.

Datos almacenados:

* clientes
* citas
* horarios disponibles
* historial de servicios
* registros de ventas

La base de datos es gestionada mediante **Supabase**.

---

## 3.5 Sistema de Notificaciones

El sistema utiliza la API de **WhatsApp** para enviar notificaciones automáticas como:

* confirmación de citas
* recordatorios
* cancelaciones
* mensajes informativos

---

## 3.6 Sistema de Inteligencia Artificial

El sistema puede integrar **OpenAI** para generar análisis automáticos de ventas y reportes del negocio.

Esto permite al administrador comprender mejor el rendimiento de la barbería.

---

# 4. Flujo General del Sistema

El funcionamiento general del sistema sigue el siguiente flujo:

1. El cliente accede al formulario de reservas.
2. El cliente selecciona fecha y hora para la cita.
3. El formulario envía los datos mediante un webhook.
4. n8n recibe la solicitud y procesa la información.
5. La cita se registra en la base de datos.
6. El cliente recibe una confirmación por WhatsApp.
7. Antes de la cita el sistema envía recordatorios automáticos.

---

# 5. Diagramas del Sistema

Los diagramas utilizados para describir la arquitectura del sistema se encuentran en la carpeta:

/docs/diagrams

Diagramas incluidos:

* Diagrama de arquitectura del sistema
* Diagrama de flujo de automatización
* Diagrama de casos de uso

---

# 6. Stack Tecnológico

Las tecnologías utilizadas en el proyecto son:

Frontend

* Vercel

Backend

* n8n

Base de datos

* Supabase

Integraciones

* API de WhatsApp
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
