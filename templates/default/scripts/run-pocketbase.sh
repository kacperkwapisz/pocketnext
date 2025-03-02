#!/bin/bash

# Script configuration
# This script is package manager agnostic - works with npm, yarn, pnpm, bun
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPTS_DIR")"
PB_BINARY="$ROOT_DIR/pocketbase/pocketbase"

# Default values
PB_VERSION=${PB_VERSION:-0.25.8}
PB_DATA_DIR="$ROOT_DIR/pb_data"
PB_HOST="0.0.0.0"
PB_PORT="8090"

echo "PocketNext Development Environment"
echo "---------------------------------"

# Check if PocketBase binary exists, if not download it
if [ ! -f "$PB_BINARY" ]; then
  echo "🔍 PocketBase binary not found. Downloading now..."
  "$SCRIPTS_DIR/download-pocketbase.sh"
fi

# Check if .env file exists, if so load it
if [ -f "$ROOT_DIR/.env" ]; then
  echo "📄 Loading environment variables from .env file..."
  export $(grep -v '^#' "$ROOT_DIR/.env" | xargs)
fi

echo "🚀 Starting PocketBase v${PB_VERSION}..."

# Run PocketBase with simple configuration - no admin credentials
"$PB_BINARY" serve --http="${PB_HOST}:${PB_PORT}" --dir="$PB_DATA_DIR" 