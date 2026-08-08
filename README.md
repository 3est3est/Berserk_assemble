# Internet Programming

---

## 🛠️ Tech Stack

### **Frontend**

- **Framework:** Angular 21 
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

## Getting Started

### 1. Prerequisites

- [Rust](https://www.rust-lang.org/)
- [Node.js](https://nodejs.org/) & [Angular CLI](https://angular.io/cli)
- [PostgreSQL](https://www.postgresql.org/)

### 2. Environment Configuration

Create a `.env` file in the `server` directory and configure the following variables:

```env
STAGE=Local
SERVER_PORT=8000
DATABASE_URL=postgres://<username>:<password>@<host>:<port>/<database_name>
JWT_USER_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Database Migration

```bash
# Inside the server directory
diesel migration run
```
