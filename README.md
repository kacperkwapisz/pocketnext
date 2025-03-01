# PocketNext

![PocketNext: Next.js + PocketBase Starter](https://img.shields.io/badge/PocketNext-Starter-blue)

A minimalist, production-ready starter for building full-stack applications with [Next.js](https://nextjs.org) and [PocketBase](https://pocketbase.io).

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/kacperkwapisz/pocketnext.git
cd pocketnext

# Install dependencies and download PocketBase
npm run setup

# Start the development environment
npm run dev
```

Visit:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **PocketBase Admin**: [http://localhost:8090/_/](http://localhost:8090/_/)

## 🧰 Core Features

- **Next.js 15** with App Router
- **PocketBase** backend (database, auth, file storage)
- **Tailwind CSS** styling
- **TypeScript** support
- **Development Tools** with live reload

## 📦 Project Structure

```
pocketnext/
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

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js and PocketBase for development |
| `npm run dev:next` | Start only Next.js development server |
| `npm run dev:pb` | Start only PocketBase server |
| `npm run dev:pb:admin` | Start PocketBase with admin setup prompt |
| `npm run build` | Build Next.js for production |
| `npm run start` | Start Next.js production server |
| `npm run setup` | Install dependencies and download PocketBase |
| `npm run setup:db` | Only download PocketBase |
| `npm run setup:admin` | Set up PocketBase admin credentials interactively |

## 📋 Package Manager Commands

Use the package manager of your choice:

<table>
<tr>
  <th>Task</th>
  <th>npm</th>
  <th>yarn</th>
  <th>pnpm</th>
  <th>bun</th>
</tr>
<tr>
  <td>Setup</td>
  <td><code>npm run setup</code></td>
  <td><code>yarn setup</code></td>
  <td><code>pnpm setup</code></td>
  <td><code>bun setup</code></td>
</tr>
<tr>
  <td>Install Only</td>
  <td><code>npm install</code></td>
  <td><code>yarn</code></td>
  <td><code>pnpm install</code></td>
  <td><code>bun install</code></td>
</tr>
<tr>
  <td>Setup PocketBase</td>
  <td><code>npm run setup:db</code></td>
  <td><code>yarn setup:db</code></td>
  <td><code>pnpm setup:db</code></td>
  <td><code>bun setup:db</code></td>
</tr>
<tr>
  <td>Setup Admin</td>
  <td><code>npm run setup:admin</code></td>
  <td><code>yarn setup:admin</code></td>
  <td><code>pnpm setup:admin</code></td>
  <td><code>bun setup:admin</code></td>
</tr>
<tr>
  <td>Development</td>
  <td><code>npm run dev</code></td>
  <td><code>yarn dev</code></td>
  <td><code>pnpm dev</code></td>
  <td><code>bun dev</code></td>
</tr>
<tr>
  <td>PocketBase Only</td>
  <td><code>npm run dev:pb</code></td>
  <td><code>yarn dev:pb</code></td>
  <td><code>pnpm dev:pb</code></td>
  <td><code>bun dev:pb</code></td>
</tr>
<tr>
  <td>PocketBase with Admin</td>
  <td><code>npm run dev:pb:admin</code></td>
  <td><code>yarn dev:pb:admin</code></td>
  <td><code>pnpm dev:pb:admin</code></td>
  <td><code>bun dev:pb:admin</code></td>
</tr>
<tr>
  <td>Next.js Only</td>
  <td><code>npm run dev:next</code></td>
  <td><code>yarn dev:next</code></td>
  <td><code>pnpm dev:next</code></td>
  <td><code>bun dev:next</code></td>
</tr>
<tr>
  <td>Build</td>
  <td><code>npm run build</code></td>
  <td><code>yarn build</code></td>
  <td><code>pnpm build</code></td>
  <td><code>bun build</code></td>
</tr>
<tr>
  <td>Type Generation</td>
  <td><code>npm run typegen</code></td>
  <td><code>yarn typegen</code></td>
  <td><code>pnpm typegen</code></td>
  <td><code>bun typegen</code></td>
</tr>
<tr>
  <td>Start Production</td>
  <td><code>npm start</code></td>
  <td><code>yarn start</code></td>
  <td><code>pnpm start</code></td>
  <td><code>bun start</code></td>
</tr>
<tr>
  <td>Lint</td>
  <td><code>npm run lint</code></td>
  <td><code>yarn lint</code></td>
  <td><code>pnpm lint</code></td>
  <td><code>bun lint</code></td>
</tr>
</table>

## 🔐 Setting Up PocketBase Admin

For security reasons, the default PocketBase setup doesn't include admin credentials. You have several options:

1. **Interactive Setup**:
   ```bash
   npm run setup:admin
   ```
   This will prompt you for admin email and password, with an option to save to your .env file.

2. **Run with Admin Prompt**:
   ```bash
   npm run dev:pb:admin
   ```
   Similar to above but runs PocketBase after setup.

3. **Use Environment Variables**:
   Add to your .env file:
   ```
   PB_ADMIN_EMAIL=your-email@example.com
   PB_ADMIN_PASSWORD=your-secure-password
   ```
   Then run with admin mode: `npm run dev:pb:admin`

4. **First-Run Setup**:
   Just run PocketBase normally and create admin account through the web UI:
   ```bash
   npm run dev:pb
   ```
   Then visit http://localhost:8090/_/ and follow the setup instructions.

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
npm run typegen
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
