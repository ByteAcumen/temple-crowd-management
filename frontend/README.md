# Temple Smart E-Pass Frontend

Modern, responsive Next.js frontend for the Temple Crowd Management System.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Auth pages (login, register)
│   │   ├── admin/          # Admin dashboard
│   │   ├── dashboard/      # User dashboard
│   │   ├── gatekeeper/     # Gatekeeper scanner
│   │   └── live/           # Live crowd monitoring
│   ├── components/         # Reusable components
│   ├── lib/               # API client, auth context
│   └── hooks/             # Custom React hooks
└── public/               # Static assets
```

## 👥 User Roles

| Role | Pages |
|------|-------|
| **User** | `/dashboard`, `/temples`, `/bookings` |
| **Gatekeeper** | `/gatekeeper/scan` |
| **Temple Admin** | `/admin/dashboard` (assigned temples only) |
| **Super Admin** | `/admin/*` (full access + `/admin/users`) |

## 🔒 Protected Routes

Routes are protected via `ProtectedRoute` component:

```tsx
<ProtectedRoute allowedRoles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>
```

## 🐳 Docker

```bash
# Build production image
docker build -t temple-frontend .

# Run container
docker run -p 3000:3000 temple-frontend
```

## 🎨 Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **Tailwind CSS v4**
- **Framer Motion** (animations)
- **html5-qrcode** (QR scanning)

## 📝 Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```
