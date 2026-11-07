# SenseiFi Influencer

React influencer portal for SenseiFi, built with Vite and TypeScript. The first screen is influencer sign up.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npm run lint` — run Oxlint

## Structure

```
src/
├── config/          # Project identity, environment, API settings
├── theme/           # Colors, type, and spacing
├── navigation/      # Route names
├── views/pages/     # Sign up, login, and overview
├── models/          # Data layer
├── controllers/     # Application logic
└── utils/           # Shared helpers
```

## Environment

Copy `.env.example` to `.env` and set `VITE_API_URL`.
