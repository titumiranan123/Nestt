This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Install dependencies and create the panel's local environment file:

```bash
npm install
cp .env.example .env.local
```

Generate a unique secret and put it in `.env.local` as `AUTH_SECRET` (do not commit or share it):

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

`AUTH_SECRET` must contain at least 32 characters. The panel validates this at startup because it signs and encrypts authentication sessions. Set `BACKEND_API_URL` to the URL of the Nest API, and set `AUTH_URL` to the panel's own URL. Restart the dev server after changing `.env.local`.

Start the development server:

```bash
npm run dev
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
