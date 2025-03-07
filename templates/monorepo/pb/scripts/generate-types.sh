#!/bin/bash

# Script to generate TypeScript types from PocketBase schema
# This script is package manager agnostic - works with npm, yarn, pnpm, bun

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PB_DIR="$(dirname "$SCRIPTS_DIR")"
ROOT_DIR="$(dirname "$PB_DIR")"
TYPES_OUTPUT_DIR="$ROOT_DIR/packages/db/src"

# Load environment variables if .env exists
if [ -f "$ROOT_DIR/.env" ]; then
  echo "📄 Loading environment variables from .env file..."
  export $(grep -v '^#' "$ROOT_DIR/.env" | xargs)
fi

# Default PocketBase URL
PB_URL=${NEXT_PUBLIC_POCKETBASE_URL:-http://127.0.0.1:8090}

echo "PocketBase TypeScript Generator (Monorepo)"
echo "----------------------------------------"
echo "🔗 Using PocketBase URL: $PB_URL"

# Check if pocketbase-typegen is installed
if ! command -v pocketbase-typegen &> /dev/null; then
  echo "🔍 pocketbase-typegen not found. Checking package managers..."
  
  # Try with npx
  if command -v npx &> /dev/null; then
    echo "✅ Found npx. Using npx pocketbase-typegen..."
    TYPEGEN_CMD="npx pocketbase-typegen"
  # Try with pnpm
  elif command -v pnpm &> /dev/null; then
    echo "✅ Found pnpm. Using pnpm dlx pocketbase-typegen..."
    TYPEGEN_CMD="pnpm dlx pocketbase-typegen"
  # Try with bun
  elif command -v bun &> /dev/null; then
    echo "✅ Found bun. Using bunx pocketbase-typegen..."
    TYPEGEN_CMD="bunx pocketbase-typegen"
  else
    echo "❌ No suitable package manager found. Please install pocketbase-typegen globally."
    exit 1
  fi
else
  TYPEGEN_CMD="pocketbase-typegen"
fi

# Make sure the output directory exists
mkdir -p "$TYPES_OUTPUT_DIR"

echo "🔄 Generating TypeScript types from PocketBase schema..."
$TYPEGEN_CMD --db "$PB_URL" --out "$TYPES_OUTPUT_DIR/types.ts" --module esm

if [ $? -eq 0 ]; then
  echo "✅ Types generated successfully at: $TYPES_OUTPUT_DIR/types.ts"
  
  # Create or update the index.ts file to export the types
  if [ ! -f "$TYPES_OUTPUT_DIR/index.ts" ]; then
    echo "export * from './types';" > "$TYPES_OUTPUT_DIR/index.ts"
    echo "export * from './client';" >> "$TYPES_OUTPUT_DIR/index.ts"
    echo "📝 Created index.ts file to export types."
  fi
  
  echo "🎉 Type generation complete!"
else
  echo "❌ Failed to generate types. Please check if PocketBase is running at $PB_URL"
  exit 1
fi 