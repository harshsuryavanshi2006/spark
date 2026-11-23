# ⚡ Spark — College Event Hub

### Discover. Participate. Grow. Your Campus, Your Stage.

**Spark — College Event Hub** is a full-stack campus engagement web application built with **React, TypeScript, TanStack Start, Tailwind CSS, and Firebase**. It helps college students discover campus events, join student clubs, register for activities in seconds, and track their campus journey from a personalized student dashboard.

---

## 🎓 About Spark

Managing college events, club memberships, and student registrations across posters, spreadsheets, and chat groups can quickly become disorganized.

**Spark brings all student campus activities together in one simple, interactive portal.**

Students can explore upcoming, ongoing, and past events, filter by category, join campus clubs with live member counts, submit suggestions for new clubs, and manage their own student profile and registered events in one place.

---

## ✨ Features

* 🎉 **Dynamic Events Explorer (`/events`)**  
  Browse upcoming, ongoing, and past campus events synced live from Cloud Firestore, with instant search, category filters, and **Registered** status badges.

* 📝 **Streamlined Event Registration (`/registration`)**  
  Register for one or multiple campus events with Zod-validated student details (`Division`, `Batch`, `Year`, `DOB`, `College`, `Phone`) that auto-fill from your saved profile.

* 🏛️ **Campus Clubs & Live Counts (`/clubs`)**  
  Explore campus communities (*Dance*, *Web Designing*, *Game Designing*, *Robotics*, *Arts & Design*, *Sports*) with transactionally updated member counts and one-click club joining.

* 💡 **Club Suggestions**  
  Signed-in students can pitch new club ideas directly from the Clubs page, stored securely for admin review.

* 👤 **Student Profile Dashboard & Editing (`/profile`)**  
  Track total registered events, joined clubs, dynamic progress bar, upcoming schedule, and recent activity timeline — plus edit **Full Name**, **Year**, **Department**, and upload/crop a **Profile Picture** right in the browser.

* 🔐 **Secure Authentication & Owner-Scoped Data (`/auth`)**  
  Powered by Firebase Authentication (Google Sign-In) and hardened Firestore Security Rules (`firestore.rules`) ensuring students can only view and edit their own private records.

* 🔗 **Shared Backend Architecture**  
  Designed with a shared Cloud Firestore schema (`events`, `event_registrations`, `profiles`, `clubs`, `club_memberships`, `club_suggestions`, `admins`) so a separate **Admin Portal** frontend can manage events, registrations, and club suggestions in real time.

---

## 🛠️ Tech Stack

| Technology              | Purpose                                             |
| ----------------------- | --------------------------------------------------- |
| React 19 & TypeScript   | Component-based UI and type-safe application logic  |
| TanStack Start & Router | File-based SSR routing and protected route layouts  |
| TanStack React Query    | Server/Firestore state caching and live invalidation |
| Tailwind CSS v4         | Responsive styling and custom campus theme          |
| Firebase Authentication | User sign-in (Google OAuth popup)                   |
| Cloud Firestore         | Shared NoSQL database & transactional member counts |
| Zod                     | Shared form and payload validation schemas          |
| Vitest                  | Unit and route-matching tests                       |
| Vite 8                  | Fast development server and production bundling     |
| Git & GitHub            | Version control and collaboration                   |

---

## 🔄 How It Works

```text
Student Visits Spark (Home / Events / Clubs)
    ↓
Signs In with Google (Firebase Auth)
    ↓
Explores Live Events & Clubs from Cloud Firestore
    ↓
Submits Event Registration / Joins Club / Edits Profile
    ↓
Zod Validation + Hardened Firestore Security Rules
    ↓
Saved to Shared Firestore Database (profiles, event_registrations, clubs)
    ↓
Instant Sync Across Student Dashboard & Future Admin Portal
```

---

## 📁 Project Structure

```text
college-event-hub/
├── src/
│   ├── routes/                  # File-based routes (Home, Events, Clubs, Auth, Profile, Registration)
│   ├── components/              # Reusable UI components, AccountProvider, thumbnails, fields
│   ├── lib/                     # Shared Zod rules, Firestore queries (events, clubs, student)
│   ├── integrations/firebase/   # Firebase App, Auth, Firestore & error handler setup
│   └── test/                    # Vitest suites for routing, student rules, and club rules
├── public/                      # Static public assets
├── firestore.rules              # Hardened Cloud Firestore security rules (Student + Admin RBAC)
├── firebase-blueprint.json      # Canonical Firestore schema definitions
├── firebase-applet-config.json  # Firebase project & database client configuration
└── package.json                 # Dependencies and scripts
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

* **Node.js** (v20 or higher recommended)
* **npm**
* **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/harshsuryavanshi2006/college-event-hub.git
```

### 2. Navigate to the Project

```bash
cd college-event-hub
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Firebase Configuration

The Firebase client configuration is wired through `firebase-applet-config.json` and security rules live in `firestore.rules`.

* **Google Sign-In** is enabled in Firebase Authentication.
* **Cloud Firestore** security rules protect `profiles`, `event_registrations`, `clubs`, `club_memberships`, `club_suggestions`, `events`, and `admins`.

### 5. Run the Application

```bash
npm run dev
```

The Spark Student Portal will start on **`http://localhost:3000`**.

### 6. Run Tests & Production Build

```bash
npm test
npm run build
```

---

## 🎯 Project Objectives

* Simplify how students discover and register for campus events and clubs.
* Replace scattered forms and spreadsheets with one unified student portal.
* Maintain strict data privacy and validation using Zod schemas and Firestore security rules.
* Establish a shared Firestore backend seamlessly accessible by a separate Admin Portal.
* Gain hands-on experience with modern full-stack React, TypeScript, and Firebase engineering.

---

## 🧠 Key Learnings

Building Spark provided practical experience with:

* Full-stack React, TypeScript, and file-based routing with TanStack Start
* Server-Side Rendering (SSR) and client hydration safety with Firebase Auth
* Real-time NoSQL data modeling and atomic transactions in Cloud Firestore
* Writing and auditing zero-trust Firestore Security Rules (`firestore.rules`)
* Client-side schema validation with Zod and browser image resizing for profile photos
* Testing application rules and routing with Vitest
* Collaborating and versioning with Git and GitHub

---

## 🔮 Future Enhancements

* 🛡️ **College Email Authentication** — Restrict student sign-ups exclusively to verified official college email domains.
* 🪪 **Student ID Card Verification** — Upload and verify college ID card photos inside the student profile for campus safety.
* 🧑‍💼 **Dedicated Admin Portal** — Separate admin frontend sharing the same Firestore backend for managing events, attendance, registrations, and club approvals.
* 🏅 **Certificates & Scores** — Digital participation certificates and activity scores inside the student profile.
* 📅 **Interactive Digital Calendar & Notifications** — Personalized reminders for upcoming registered events.

---

## 📌 Project Status

**🟢 Active Development**  
The Student Portal (Home, Events, Clubs, Google Sign-In, Event Registration, Profile Dashboard, Profile Editing, and Shared Firestore Backend) is complete and operational.

---

## 👨‍💻 Developer

### Harsh Suryavanshi ([@harshsuryavanshi2006](https://github.com/harshsuryavanshi2006))

---

*This project is developed for campus collaboration, educational, and learning purposes.*
