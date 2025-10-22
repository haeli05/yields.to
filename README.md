yields.to is a Next.js application that surfaces yield opportunities across the Plasma chain.  
The UI is powered by **shadcn/ui**, Tailwind CSS (v4), and Next.js App Router.

## Running locally

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore the live Plasma strategy dashboard.

## Scripts

- `npm run dev` – start the development server.
- `npm run build` – create a production build.
- `npm run start` – run the production build.
- `npm run lint` – run ESLint with the Next.js config.

## UI toolkit

The project is initialized with shadcn/ui. Common primitives such as `button`, `card`, `badge`, `input`, and `tabs`
are already installed in `src/components/ui`.

To scaffold additional components:

```bash
npx shadcn@latest add <component>
```

The component registry is configured in `components.json`.

## Project structure

- `src/app` – Next.js App Router routes and layouts.
- `src/components/ui` – shared shadcn/ui components.
- `src/lib/utils.ts` – utility helpers used by the UI layer.
- `public` – static assets.

## Deployment

Deploy the app with any platform that supports Next.js (Vercel, Netlify, etc.).  
The default configuration targets Node.js 18+ and includes metadata for the yields.to domain.
