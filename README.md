<div align="center">
  <img src="https://ui-avatars.com/api/?name=Taj+Platform&background=0284c7&color=fff&size=150&rounded=true" alt="Taj Platform Logo" width="150" height="150" />

  <h1>👑 Taj Educational Platform (منصة تاج التعليمية)</h1>
  
  <p>
    <b>A Next-Generation E-Learning & Video Tutoring App built for scale.</b>
  </p>

  <!-- Badges -->
  <p>
    <a href="https://laravel.com"><img src="https://img.shields.io/badge/Laravel-12.0-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel 12" /></a>
    <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-14.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 14" /></a>
    <a href="https://filamentphp.com"><img src="https://img.shields.io/badge/FilamentPHP-3.2-EAB308?style=for-the-badge&logo=php&logoColor=white" alt="Filament v3" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://www.agora.io/"><img src="https://img.shields.io/badge/Agora-Video_Calling-099DFD?style=for-the-badge&logo=agora&logoColor=white" alt="Agora" /></a>
    <a href="https://www.docker.com/"><img src="https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" /></a>
  </p>

  <p align="center">
    Taj Educational Platform is a comprehensive, production-ready full-stack application connecting students and specialized teachers seamlessly through high-quality live video sessions, interactive bookings, and a robust management portal.
  </p>
</div>

<br />

## 📖 Table of Contents
- [Live Beta Access](#-live-beta-access)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Project Architecture](#-project-architecture)
- [Testing](#-testing)
- [Author](#-author)

---

## 🌐 Live Beta Access

Explore the live environments hosted in our beta phase:

- **🎓 Frontend (Students & Teachers)**: <a href="https://taj-platform.vercel.app/" target="_blank" rel="noopener noreferrer">Live Demo</a>
- **👑 Admin Dashboard Panel**: <a href="https://taj-backend-t4ki.onrender.com/admin/login" target="_blank" rel="noopener noreferrer">Admin Login</a>
- **⚙️ Backend API Base URL**: <a href="https://taj-backend-t4ki.onrender.com/" target="_blank" rel="noopener noreferrer">API Server</a>

---

## ✨ Key Features

- 🔐 **Roles & Access Management:** Full RBAC using Spatie Permissions. Distinct portals for Students, Verified Teachers (e.g., Chemistry, Physics), and System Admins.
- 📹 **Live Video Tutoring:** Real-time, low-latency audio and video communication powered by robust **Agora RTC SDK**.
- 📅 **Smart Booking System:** Localized appointment scheduling enabling students to book subject matter experts efficiently.
- 👑 **Advanced Admin Dashboard:** A deeply customizable administration UI built on **FilamentPHP**, fully localized into Arabic with custom Taj branding (منصة تاج التعليمية).
- 🌍 **Full Localization & RTL Support:** Native Right-to-Left (RTL) interface modeling localized entirely in Arabic for the Middle Eastern audience.
- 🛡️ **Secure API & Authentication:** Token-based security and robust protected API endpoints handled seamlessly by **Laravel Sanctum**.

---

## 🛠️ Technology Stack

The project operates as a modern monorepo, decoupling the interactive presentation layer from the backend RESTful API services.

### Backend (`/backend`)
> **Core:** Laravel 12.0 • PHP 8.3 • MySQL 8.0 <br/>
> **Admin & Security:** Filament V3 • Laravel Sanctum • Spatie Permission <br/>
> **Testing:** PHPUnit / PestPHP

### Frontend (`/frontend`)
> **Core:** Next.js 14.2 (App Router) • React 18 • TypeScript <br/>
> **Styling & UI:** Tailwind CSS 3.4 • PostCSS <br/>
> **Real-time Engine:** Agora React UIKit • Agora RTC SDK <br/>
> **Testing:** Jest • React Testing Library

---

## 🚀 Getting Started

The recommended way to boot up the complete Taj Platform stack (Frontend, Backend, and Database) is using **Docker Compose**.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- **Node.js 20+** (For local frontend development outside Docker)
- **PHP 8.3 & Composer** (For local backend development outside Docker)

### 1. Clone & Prepare

```bash
# Clone the repository
git clone https://github.com/Ammar-1993/Taj-Platform.git
cd Taj-Platform

# Copy Environment Files
cp backend/.env.example backend/.env
# Note: Ensure you configure your Agora app credentials and Database settings in backend/.env
```

### 2. Ignite the Docker Environment

Our `docker-compose.yml` automates the bootup of all essential services.

```bash
docker-compose up -d --build
```
> **What this spins up:**
> - 🗄️ **MySQL Engine** (Port `3307` mapped locally to `3306`)
> - 🐘 **Laravel API Server** (Port `8000`)
> - ⚛️ **Next.js Client** (Port `3000`)

### 3. Backend Setup & Seeding

Execute these commands inside the `laravel.test` container terminal:

```bash
# Enter the Laravel container
docker-compose exec laravel.test bash

# Install dependencies and bootstrap the instance
composer install
php artisan key:generate

# Migrate and seed the database with initial verified teacher accounts
php artisan migrate --seed
```

#### Local Development Endpoints
- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:8000/api](http://localhost:8000/api)
- **Filament Admin Panel:** [http://localhost:8000/admin](http://localhost:8000/admin)

---

## 🏗️ Project Architecture

1. **Decoupled API Routing:** The Next.js frontend behaves as an independent SPA application, communicating strictly with Laravel's typed API endpoints via `axios`.
2. **Secure Video Handshakes:** When a session goes live, Next.js calls local API wrapper endpoints to retrieve Agora RTC connection tokens—securely minted by the Laravel Backend.
3. **Centralized Administration:** Site operators manage syllabi, user verifications, billing, and system states exclusively through the Filament Admin UI.

---

## 🧪 Testing

Both applications uphold their isolated testing frameworks ensuring maximal reliability before shipping.

**Backend Tests (PHPUnit):**
```bash
cd backend
php artisan test
```

**Frontend Tests (Jest):**
```bash
cd frontend
npm run test
```

---

<div align="center">
  <br />
  <p>Engineered with ❤️ by <b>Ammar Al-Najjar</b></p>
</div>
