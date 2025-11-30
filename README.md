# CertiGen - Enterprise Credential Management System

CertiGen is a full-stack, cloud-native application designed to issue, manage, and verify digital credentials at scale. Built with a Stateless Architecture, it leverages Node.js streams for on-the-fly PDF generation and MongoDB for high-performance indexing of verification records.

Architectural Highlight: This system eschews local file storage in favor of dynamic generation (Puppeteer), ensuring zero-storage overhead and full compatibility with ephemeral container environments (Docker/Kubernetes).

🚀 Key Technical Features

🛡️ Security & Access Control

RBAC (Role-Based Access Control): Granular permissions for Admins (manage templates) vs. Issuers (issue certificates).

HttpOnly Cookies: JWT tokens are stored securely to prevent XSS attacks.

Helmet & Rate Limiting: DDOS protection and secure HTTP headers enabled by default.

⚡ Core Engine

Stateless PDF Streaming: Uses Puppeteer (Headless Chrome) to render pixel-perfect PDFs from HTML/CSS templates on demand.

Dynamic QR Codes: Embedded verification links generated in real-time.

Template Engine: Coordinate-based mapping system (X/Y JSON config) allows admins to design certificates without touching code.

📧 Automated Distribution

Integrated Email Pipeline: Uses Nodemailer to generate, sign, and email PDF attachments instantly upon issuance.

🛠️ Tech Stack

Domain

Technologies

Rationale

Backend

Node.js, Express.js

Non-blocking I/O ideal for handling concurrent PDF generation tasks.

Database

MongoDB (Atlas)

Flexible schema for storing dynamic template layouts.

Frontend

HTML5, Tailwind CSS, Vanilla JS

Lightweight SPA architecture without build-step complexity.

PDF Engine

Puppeteer

Industry standard for high-fidelity rendering.

Security

BCrypt, JWT, Helmet, CORS

Enterprise-grade security compliance.

⚙️ Installation & Setup

Prerequisites

Node.js >= 18.0.0

MongoDB Atlas Connection String

Gmail App Password (for emails)

1. Clone the Repository

git clone [https://github.com/YourUsername/CertiGen.git](https://github.com/YourUsername/CertiGen.git)
cd CertiGen


2. Backend Setup

cd backend
npm install

# Configure Environment Variables
# Create a .env file based on your configuration requirements


3. Start Development Server

# Inside /backend directory
npm run dev
# Server runs on http://localhost:5000


4. Access the App

Open your browser to http://localhost:5000.

Public Portal: Verification search.

Admin Portal: /admin.html (Log in to manage).

🔌 API Documentation

Method

Endpoint

Access

Description

POST

/api/auth/login

Public

Authenticate and set HttpOnly cookie.

GET

/api/certificates

Private

List certificates (Pagination enabled).

POST

/api/certificates

Issuer

Generate a new certificate & Email it.

GET

/api/verify/:id

Public

Verify certificate validity via ID.

GET

/api/certificates/:id/download

Public

Stream PDF directly to browser.

📜 License

This project is licensed under the MIT License.
