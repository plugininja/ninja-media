#!/usr/bin/env bash
# =============================================================================
# zip-free.sh
#
# Creates ninja-media-free.zip from dist-free/ with the correct folder
# structure: all files inside a ninja-media/ root folder.
#
# Usage:
#   npm run zip:free
#   # or directly:
#   bash scripts/zip-free.sh
# =============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_FREE="$ROOT_DIR/dist-free"
ZIP_NAME="ninja-media-free.zip"
ZIP_PATH="$ROOT_DIR/$ZIP_NAME"

if [ ! -d "$DIST_FREE" ]; then
    echo "❌  dist-free/ not found. Run 'npm run strip-premium' first."
    exit 1
fi

# Remove previous ZIP if it exists
rm -f "$ZIP_PATH"

# Create a temporary staging folder with the plugin folder name
STAGE_DIR="$ROOT_DIR/.zip-stage"
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR/ninja-media"
cp -r "$DIST_FREE/." "$STAGE_DIR/ninja-media/"

cd "$STAGE_DIR"
zip -r "$ZIP_PATH" "ninja-media"

# Clean up staging folder
rm -rf "$STAGE_DIR"

ZIP_SIZE=$(du -sh "$ZIP_PATH" | cut -f1)
echo ""
echo "✅  Created: $ZIP_NAME ($ZIP_SIZE)"
echo "   Location: $ZIP_PATH"
echo ""
echo "   Contents:"
unzip -l "$ZIP_PATH" 2>/dev/null | grep -v "^Archive\|^---\|files$" \
    | awk '{print $NF}' | head -30 | sed 's/^/   /'
echo ""
