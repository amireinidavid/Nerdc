Nerdc Journal Project

This is the project structure 

Client Side 
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Landing page (Home)
│   ├── about/
│   ├── contact/
│   ├── blog/
│   ├── auth/                 # Login/Register pages
│   ├── dashboard/            # After login dashboard (upload, profile, etc.)
│   ├── journals/
│   │   ├── [id]/             # Journal detail page
│   │   └── upload/           # Upload form
│   └── cart/                 # Shopping cart and checkout
├── components/               # Reusable UI components (Navbar, Footer, Cards)
├── constants/                # Static values, enums, filters, etc.
├── hooks/                    # Custom React hooks (useAuth, useCart, etc.)
├── lib/                      # Utils (axios client, SEO, image helpers)
├── store/                    # Zustand or Redux setup
├── types/                    # TypeScript interfaces & types
├── styles/                   # Global CSS, Tailwind config
├── public/                   # Public assets
├── middleware.ts             # For protected routes (auth, etc.)
└── tailwind.config.ts

Server side 

backend/
├── src/
│   ├── controllers/          # Business logic (e.g., journalController.js)
│   ├── routes/               # Express routers
│   ├── middleware/           # Auth, error handling, rate limiting, etc.
│   ├── services/             # External APIs (e.g., cloudinary, stripe)
│   ├── prisma/               # Prisma schema & migrations
│   ├── utils/                # Helper functions
│   ├── uploads/              # Temp file storage (optional)
│   ├── config/               # DB, cloudinary, stripe config
│   ├── app.ts                # Express app setup
│   └── server.ts             # Start the server
├── .env
├── tsconfig.json
└── package.json


So here where we start we setup our environment.We start with the frontend we make our designs and the rest