---

# 🎓 CertiGen – Enterprise E-Certificate Generation System

CertiGen is a full-stack, cloud-native application designed to issue, manage, and verify digital credentials at scale. Built with a **stateless architecture**, it leverages **Node.js streams** for on-the-fly PDF generation and **MongoDB** for high-performance indexing of verification records.

### 🏗 Architectural Highlight

This system avoids local file storage entirely by using **Puppeteer** for dynamic generation, ensuring **zero-storage overhead** and full compatibility with container-based deployments (Docker/Kubernetes).

---

## 🚀 Key Features

### 🛡️ Security & Access Control

* **RBAC (Role-Based Access Control):**
  Granular permissions for *Admins* (manage templates) and *Issuers* (issue certificates).
* **HttpOnly Cookies:**
  Secure token storage to prevent XSS vulnerabilities.
* **Helmet & Rate Limiting:**
  Built-in protection against DDoS attacks and secure HTTP headers.

---

### ⚡ Core Engine

* **Stateless PDF Streaming:**
  Uses Puppeteer (Headless Chrome) to render pixel-perfect PDFs from HTML/CSS templates.
* **Dynamic QR Codes:**
  Embedded verification links are generated on the fly.
* **Template Engine:**
  Coordinate-based (X/Y) JSON mapping for code-free template design.

---

### 🎨 Frontend Experience

* **SPA Architecture:**
  Built with HTML5, Vanilla JS, and Tailwind CSS—lightweight and dependency-free.
* **Lazy Loading:**
  Loads only the required views/assets.
* **Public Verification Portal:**
  Employers can verify certificates without authentication.

---

### 📧 Automated Distribution

* **Email Pipeline:**
  Integrated with Nodemailer to generate, sign, and send PDF certificates instantly.

---

## 🛠 Tech Stack

| Component      | Technology                      | Rationale                                    |
| -------------- | ------------------------------- | -------------------------------------------- |
| **Frontend**   | HTML5, Tailwind CSS, Vanilla JS | Lightweight and fast; no build tools needed. |
| **Backend**    | Node.js, Express.js             | Perfect for handling concurrent PDF tasks.   |
| **Database**   | MongoDB (Atlas)                 | Flexible schema for dynamic layouts.         |
| **PDF Engine** | Puppeteer                       | High-fidelity rendering.                     |
| **Security**   | BCrypt, JWT, Helmet, CORS       | Enterprise-grade protection.                 |

---

## ⚙️ Installation & Setup

### **Prerequisites**

* Node.js **>= 18**
* MongoDB Atlas connection string
* Gmail App Password (for SMTP)

---

### 1. **Clone the Repository**

```bash
git clone https://github.com/KALPESH003/CertiGen.git
cd CertiGen
```

---

### 2. **Backend Setup**

```bash
cd backend
npm install
```

#### Create `.env` in `/backend`

```
PORT=5000
MONGO_URI=your_mongo_string
JWT_SECRET=your_secret
SMTP_EMAIL=your_email
SMTP_PASSWORD=your_app_password
```

---

### 3. **Start Development Server**

```bash
npm run dev
```

Server starts at:
👉 [http://localhost:5000](http://localhost:5000)

---

### 4. **Access the App**

* **Public Verification Portal:** `http://localhost:5000`
* **Admin Dashboard:** `http://localhost:5000/admin.html`

---

## 🔌 API Documentation

| Method   | Endpoint                         | Access  | Description                          |
| -------- | -------------------------------- | ------- | ------------------------------------ |
| **POST** | `/api/auth/login`                | Public  | Authenticate and set HttpOnly cookie |
| **GET**  | `/api/certificates`              | Private | Fetch certificates (paginated)       |
| **POST** | `/api/certificates`              | Issuer  | Generate + email certificate         |
| **GET**  | `/api/verify/:id`                | Public  | Verify certificate                   |
| **GET**  | `/api/certificates/:id/download` | Public  | Download/stream PDF                  |

---

## 📜 License

This project is licensed under the **MIT License**.

---
