# EnergyPro - Decentralized Energy Trading Platform

EnergyPro is a decentralized marketplace for peer-to-peer energy trading, built with Next.js, Prisma, and Solana blockchain integration.

## Features

- **Seller Dashboard**: List energy for sale with customizable parameters
- **Buyer Dashboard**: Browse and purchase available energy listings
- **Blockchain Integration**: Secure transactions using Solana blockchain
- **Wallet Integration**: Connect with Solana wallets for seamless transactions

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Solana (Smart Contract + SPL Tokens)
- **Authentication**: JWT-based authentication

## Prerequisites

- Node.js (v18+)
- PostgreSQL database
- Solana wallet (Phantom, Solflare, etc.)
- Solana devnet tokens for testing

## Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/energy-pro.git
cd energy-pro
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy the example environment file and update it with your configuration:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database connection string and other required variables.

4. **Initialize the database**

```bash
npx prisma migrate dev --name init
```

5. **Run the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Deployment

### Vercel Deployment

1. Fork this repository to your GitHub account
2. Sign up or log in to [Vercel](https://vercel.com)
3. Create a new project and import your GitHub repository
4. Configure the environment variables in the Vercel dashboard
5. Deploy the project

### Other Platforms

For other platforms, ensure you set up the following:

1. PostgreSQL database
2. Environment variables (see `.env.example`)
3. Build command: `npx prisma generate && next build`
4. Start command: `next start`

## Smart Contract Integration

The platform uses a Solana smart contract for secure energy trading:

- **Program ID**: 71p7sfU3FKyP2hv9aVqZV1ha6ZzJ2VkReNjsGDoqtdRQ
- **Token Mint**: HQbqWP4LSUYLySNXP8gRbXuKRy6bioH15CsrePQnfT86

## License

[MIT License](LICENSE)
