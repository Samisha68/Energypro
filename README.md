# EnergyPro - Decentralized Energy Trading Platform

EnergyPro is an open source, decentralized marketplace for peer-to-peer energy trading. Built with Next.js, MongoDB, and Solana blockchain integration, EnergyPro empowers individuals and organizations to buy and sell renewable energy directly, securely, and transparently.

## Why EnergyPro?

Traditional energy markets are centralized and often inaccessible to small producers and consumers. EnergyPro leverages blockchain technology to democratize energy trading, enabling a greener and more efficient energy ecosystem.

## Features

- **Unified Dashboard**: Seamlessly list energy for sale, browse available offers, and purchase energy—all from a single, intuitive dashboard.
- **Google Authentication**: Secure sign-in and onboarding using your Google account.
- **Blockchain-Powered Transactions**: All trades are recorded on the Solana blockchain for transparency and security.
- **Solana Wallet Integration**: Connect your Solana wallet (Phantom, Solflare, etc.) for direct, trustless payments.
- **Scalable Seller Support**: Currently, the seller address is hardcoded for demonstration. The architecture is designed to easily support multiple sellers in the future.
- **Open Source**: Built for the community, by the community. Contributions are welcome!

## How It Works

1. **Sign in with Google** to access the platform.
2. **Connect your Solana wallet** to enable blockchain transactions.
3. **List energy for sale** or **browse available energy** on the dashboard.
4. **Buy or sell energy**—all transactions are securely processed and recorded on-chain.

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB (with Mongoose)
- **Blockchain**: Solana (Smart Contract + SPL Tokens)
- **Authentication**: Google OAuth 2.0, JWT (for API)

## Prerequisites

- Node.js (v18+)
- MongoDB database (local or cloud, e.g., MongoDB Atlas)
- Solana wallet (Phantom, Solflare, etc.)
- Solana devnet tokens for testing

## Getting Started

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

Edit `.env.local` with your MongoDB connection string, Google OAuth credentials, and other required variables.

4. **Run the development server**

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Deployment

### Vercel Deployment

1. Fork this repository to your GitHub account
2. Sign up or log in to [Vercel](https://vercel.com)
3. Create a new project and import your GitHub repository
4. Configure the environment variables in the Vercel dashboard
5. Deploy the project

### Other Platforms

For other platforms, ensure you set up the following:

1. MongoDB database
2. Environment variables (see `.env.example`)
3. Build command: `next build`
4. Start command: `next start`

## Smart Contract Integration

The platform uses a Solana smart contract for secure energy trading:

- **Program ID**: You can easily generate your own
- **Token Mint**: BIJLEE/ ANY TOKEN

## Contributing

We welcome contributions from the community! To get started:

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Make your changes and commit them
4. Open a pull request describing your changes

Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for more details (or create one if it doesn't exist yet).

## License

This project is open source and available under the [MIT License](LICENSE).
