# PocketNext

![PocketNext: Next.js + PocketBase Starter](https://img.shields.io/badge/PocketNext-Starter-blue)

A minimalist, production-ready starter for building full-stack applications with [Next.js](https://nextjs.org) and [PocketBase](https://pocketbase.io).

## 🚀 Quick Start

### Using the CLI (Recommended)

```bash
# Create a new project using bunx
bunx pocketnext@latest my-app

# OR use bun create (recommended)
bun create pocketnext my-app

# Navigate to your project
cd my-app

# Start the development environment
bun dev
```

By default, PocketNext will guide you through an **interactive setup process** to customize your project. You'll be prompted to select:

- **Deployment Platform** - Choose your deployment platform (Vercel, Coolify, or Standard)
- **Docker Configuration** - Choose your Docker setup
- **Image Loader** - Choose your image loading solution
- **GitHub Workflows** - Include GitHub Actions workflow files or not

#### CLI Options

All commands support these options:

```bash
# Choose a package manager
bunx pocketnext@latest my-app --use-npm
bunx pocketnext@latest my-app --use-yarn
bunx pocketnext@latest my-app --use-pnpm
bunx pocketnext@latest my-app --use-bun

# Skip interactive prompts and use defaults
bunx pocketnext@latest my-app -y

# Skip package installation
bunx pocketnext@latest my-app --skip-install

# Show all available options
bunx pocketnext@latest --help
```

### Manual Setup

```bash
# Clone the repository
git clone https://github.com/kacperkwapisz/pocketnext.git
cd pocketnext

# Install dependencies and download PocketBase
bun setup

# Start the development environment
bun dev
```

Visit:

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **PocketBase Admin**: [http://localhost:8090/\_/](http://localhost:8090/_/)

## 🧰 Core Features

- **Next.js 15** with App Router
- **PocketBase** backend (database, auth, file storage)
- **Tailwind CSS** styling
- **TypeScript** support
- **Development Tools** with live reload
- **Interactive CLI** for project customization

## 📦 Installation Methods

PocketNext can be installed in several ways:

```bash
# Using bun (recommended)
bun create pocketnext my-app

# Using bunx
bunx pocketnext@latest my-app

# Using npx
npx pocketnext@latest my-app
```

## �� Project Structure

```
pocketnext/
├── src/                # Source code for CLI
├── templates/          # Project templates
├── public/             # Static assets
├── scripts/            # Helper scripts
└── dist/               # Compiled CLI code (generated)
```

Generated projects follow this structure:

```
your-project/
├── public/             # Static assets
├── scripts/            # Helper scripts
├── src/
│   ├── app/            # Next.js application
│   ├── components/     # React components
│   └── lib/            # Shared utilities
│       └── pocketbase/ # PocketBase client
└── pocketbase/         # PocketBase binary (generated)
```

## 🔧 Available Commands

| Command            | Description                                       |
| ------------------ | ------------------------------------------------- |
| `bun dev`          | Start Next.js and PocketBase for development      |
| `bun dev:next`     | Start only Next.js development server             |
| `bun dev:pb`       | Start only PocketBase server                      |
| `bun dev:pb:admin` | Start PocketBase with admin setup prompt          |
| `bun build`        | Build Next.js for production                      |
| `bun start`        | Start Next.js production server                   |
| `bun setup`        | Install dependencies and download PocketBase      |
| `bun setup:db`     | Only download PocketBase                          |
| `bun setup:admin`  | Set up PocketBase admin credentials interactively |
| `bun typegen`      | Generate TypeScript types from PocketBase schema  |
| `bun lint`         | Run ESLint to check code quality                  |

## 🔐 Setting Up PocketBase Admin

For security reasons, the default PocketBase setup doesn't include admin credentials. You have several options:

1. **Interactive Setup**:

   ```bash
   bun setup:admin
   ```

   This will prompt you for admin email and password, with an option to save to your .env file.

2. **Run with Admin Prompt**:

   ```bash
   bun dev:pb:admin
   ```

   Similar to above but runs PocketBase after setup.

3. **Use Environment Variables**:
   Add to your .env file:

   ```
   PB_ADMIN_EMAIL=your-email@example.com
   PB_ADMIN_PASSWORD=your-secure-password
   ```

   Then run with admin mode: `bun dev:pb:admin`

4. **First-Run Setup**:
   Just run PocketBase normally and create admin account through the web UI:
   ```bash
   bun dev:pb
   ```
   Then visit http://localhost:8090/\_/ and follow the setup instructions.

## 🛠 Advanced Features (Optional)

<details>
<summary><b>🐳 Docker Deployment</b></summary>

This project includes a production-ready Docker setup for deployment.

```bash
# Copy the example environment file
cp .env.example .env

# Build and start containers
docker-compose up -d
```

The Docker setup provides:

- Separate containers for Next.js and PocketBase
- Health checks for reliability
- Volume mounting for persistent data
- Environment variable configuration
</details>

<details>
<summary><b>🚢 CI/CD with GitHub Actions</b></summary>

Pre-configured GitHub workflows for continuous integration and deployment:

- **CI Workflow**: Builds and tests your application
- **Deployment to Coolify**: Automatically deploys to [Coolify](https://coolify.io/) hosting

To enable Coolify deployment:

1. Add `COOLIFY_WEBHOOK` and `COOLIFY_TOKEN` secrets to your GitHub repository
2. Use the `docker-compose.coolify.yml` in your Coolify configuration
</details>

<details>
<summary><b>🧪 Type Generation</b></summary>

Generate TypeScript types from your PocketBase schema:

```bash
bun typegen
```

This creates types in `src/lib/pocketbase/types.ts` for type-safe database operations.

</details>

## 📝 Development

<details>
<summary><b>📜 Changelog</b></summary>

See the [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes in each version.

</details>

<details>
<summary><b>🧑‍💻 Contributing</b></summary>

Contributions are welcome! Please feel free to submit a Pull Request.

</details>

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [PocketBase Documentation](https://pocketbase.io/docs/)

## 📄 License

MIT
