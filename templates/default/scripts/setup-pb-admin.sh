#!/bin/bash

# Script to set up PocketBase admin credentials
# This script is package manager agnostic - works with npm, yarn, pnpm, bun

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPTS_DIR")"
PB_BINARY="$ROOT_DIR/pocketbase/pocketbase"
ENV_FILE="$ROOT_DIR/.env"

echo "PocketBase Admin Setup"
echo "---------------------"

# Check if PocketBase binary exists, if not download it
if [ ! -f "$PB_BINARY" ]; then
  echo "🔍 PocketBase binary not found. Downloading now..."
  "$SCRIPTS_DIR/download-pocketbase.sh"
fi

# Load environment variables if .env exists
if [ -f "$ENV_FILE" ]; then
  echo "📄 Loading environment variables from .env file..."
  export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Check if admin credentials are provided via environment variables
if [ -n "$PB_ADMIN_EMAIL" ] && [ -n "$PB_ADMIN_PASSWORD" ]; then
  echo "👤 Using admin credentials from environment variables."
else
  # Prompt for admin credentials if not provided
  echo "🔐 Please provide admin credentials for PocketBase:"
  
  # Read email with default value
  default_email="admin@example.com"
  read -p "Email [$default_email]: " input_email
  PB_ADMIN_EMAIL=${input_email:-$default_email}
  
  # Read password with default value but hidden input
  default_password="changeme123"
  read -s -p "Password [$default_password] (hidden input): " input_password
  echo "" # Add newline after hidden input
  PB_ADMIN_PASSWORD=${input_password:-$default_password}

  # Ask if user wants to save to .env file
  read -p "Save these credentials to .env file? (y/n): " save_to_env
  if [[ $save_to_env == "y" || $save_to_env == "Y" ]]; then
    # Create or update .env file
    if [ ! -f "$ENV_FILE" ]; then
      # Copy from example if it exists
      if [ -f "$ROOT_DIR/.env.example" ]; then
        cp "$ROOT_DIR/.env.example" "$ENV_FILE"
        echo "📝 Created .env file from example."
      else
        # Create new .env file
        touch "$ENV_FILE"
        echo "# PocketNext Environment Configuration" > "$ENV_FILE"
        echo "" >> "$ENV_FILE"
        echo "NEXT_PUBLIC_POCKETBASE_URL=http://localhost:8090" >> "$ENV_FILE"
        echo "" >> "$ENV_FILE"
      fi
    fi
    
    # Update credentials in .env file
    if grep -q "PB_ADMIN_EMAIL" "$ENV_FILE"; then
      # Update existing
      sed -i.bak "s/PB_ADMIN_EMAIL=.*/PB_ADMIN_EMAIL=$PB_ADMIN_EMAIL/" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
      sed -i.bak "s/PB_ADMIN_PASSWORD=.*/PB_ADMIN_PASSWORD=$PB_ADMIN_PASSWORD/" "$ENV_FILE" && rm -f "$ENV_FILE.bak"
    else
      # Add new
      echo "PB_ADMIN_EMAIL=$PB_ADMIN_EMAIL" >> "$ENV_FILE"
      echo "PB_ADMIN_PASSWORD=$PB_ADMIN_PASSWORD" >> "$ENV_FILE"
    fi
    echo "✅ Credentials saved to .env file."
  fi
fi

echo ""
echo "🚀 Starting PocketBase with admin credentials..."
"$PB_BINARY" serve --http="0.0.0.0:8090" --dir="$ROOT_DIR/pb_data" \
  --adminEmail="$PB_ADMIN_EMAIL" --adminPassword="$PB_ADMIN_PASSWORD" 