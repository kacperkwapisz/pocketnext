#!/bin/bash

# Script configuration
# This script is package manager agnostic - works with npm, yarn, pnpm, bun
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPTS_DIR")"
PB_DIR="$ROOT_DIR/pocketbase"
PB_VERSION=${PB_VERSION:-0.25.8}

echo "PocketBase Downloader"
echo "--------------------"

# Create pocketbase directory if it doesn't exist
mkdir -p "$PB_DIR"

# Determine platform
PLATFORM="$(uname -s)"
ARCH="$(uname -m)"

# Set download URL based on platform
if [ "$PLATFORM" = "Darwin" ]; then
  if [ "$ARCH" = "arm64" ]; then
    PLATFORM_NAME="darwin_arm64"
  else
    PLATFORM_NAME="darwin_amd64"
  fi
elif [ "$PLATFORM" = "Linux" ]; then
  PLATFORM_NAME="linux_amd64"
elif [[ "$PLATFORM" == MINGW* ]] || [[ "$PLATFORM" == MSYS* ]] || [[ "$PLATFORM" == CYGWIN* ]]; then
  PLATFORM_NAME="windows_amd64"
else
  echo "❌ Unsupported platform: $PLATFORM"
  exit 1
fi

POCKETBASE_URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${PLATFORM_NAME}.zip"

echo "📥 Downloading PocketBase v${PB_VERSION} for $PLATFORM ($ARCH)..."
curl -L "$POCKETBASE_URL" -o "$PB_DIR/pocketbase.zip"

echo "📦 Extracting PocketBase..."
pushd "$PB_DIR" > /dev/null
unzip -o pocketbase.zip
rm pocketbase.zip

# Make the PocketBase binary executable
chmod +x pocketbase

echo "✅ PocketBase v${PB_VERSION} is ready at $PB_DIR/pocketbase"
popd > /dev/null 