# Dynamia AI Landing Page

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Build and Deployment

### Docker

This project includes a Dockerfile for containerization. To build and run the Docker image locally:

```bash
# Build the Docker image
docker build -t dynamia-ai-lp .

# Run the container
docker run -p 3000:3000 dynamia-ai-lp
```

### GitHub Actions

The project includes a GitHub Actions workflow in `.github/workflows/docker-build.yml` that:

1. Builds the application
2. Creates a Docker image
3. Pushes the image to GitHub Container Registry (ghcr.io)

The workflow is triggered on:
- Push to the main branch (tagged as 'latest')
- Push of tags starting with 'v' (tagged with the version number)
- Manual workflow dispatch

### Kubernetes Deployment with Helm

A Helm chart is provided in the `charts` directory for deploying to Kubernetes:

```bash
# Create image pull secret (if not already created)
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN \
  --docker-email=YOUR_EMAIL

# Install/Upgrade the application
helm upgrade --install dynamia-ai-lp ./charts/dynamia-ai-lp
```

For more detailed information about the Helm chart, see the [chart README](./charts/dynamia-ai-lp/README.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
