# ⚔️ Mission Collaborate (Berserk Assemble)

**Mission Collaborate** is a high-performance, real-time mission management and collaboration platform designed for seamless user experience, reliability, and speed—delivering a desktop-like feel on the web.

---

## ✨ System Highlights

- **🚀 Ultra-Responsive UI**: Built with Angular 21 and modern Signal-based state management, ensuring lightning-fast rendering and minimal resource consumption.
- **📡 Global Real-time Synchronization**: Powered by high-concurrency WebSockets to sync data across all users instantly. Missions, Chat, and Status updates happen in real-time without ever needing a manual page refresh.
- **🎯 Smart Mission Control**: Comprehensive lifecycle management for missions—from creation and recruitment to real-time execution and finalization.
- **🛡️ Hybrid Deletion System**: An intelligent deletion engine that balances UX and efficiency. Chiefs see instant removal for clarity, while the system retains data as long as crew members are present, performing an automated "hard delete" only when the room is empty.
- **🦀 High Performance Backend**: Driven by Rust (Axum), providing maximum stability, safety, and high-performance asynchronous processing.

---

## 🛠️ Tech Stack

### **Frontend**

- **Framework:** Angular 21 (Latest standalone architecture)
- **State Management:** Signals & RxJS for reactive data flows
- **Styling:** Vanilla CSS + Material Design Icons
- **Communication:** Dual-layer communication (WebSockets + RESTful API)

### **Backend**

- **Language:** Rust 🦀 (The language of safety and speed)
- **Web Framework:** Axum (High productivity & performance)
- **ORM:** Diesel (Type-safe SQL query builder)
- **Database:** PostgreSQL
- **Concurrency:** Tokio (Advanced asynchronous runtime)

---

## 📂 Project Architecture

This project follows **Clean Architecture** and **Domain-Driven Design (DDD)** principles to ensure maintainability and scalability:

- **Domain:** The core business logic (Entities, Repositories, Value Objects).
- **Application:** Orchestration layer handling complex workflows (Use Cases).
- **Infrastructure:** Connectors to external worlds (Database persistence, Web handlers, WebSocket Synchronization).

---

## 🚀 Getting Started

### 1. Prerequisites

- [Rust](https://www.rust-lang.org/) (Latest stable version)
- [Node.js](https://nodejs.org/) & [Angular CLI](https://angular.io/cli)
- [PostgreSQL](https://www.postgresql.org/)

### 2. Database Migration

```bash
# Inside the server directory
diesel migration run
```

### 3. Start Backend Server

```bash
cd server
cargo run
```

### 4. Start Frontend Client

```bash
cd client
npm install
ng serve
```

---
