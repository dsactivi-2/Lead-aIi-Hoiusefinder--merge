#!/bin/bash
# Install shared git hooks for the repository

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"

echo "Installing git hooks..."

# Set the hooks path to .githooks
git config core.hooksPath .githooks

# Make hooks executable
chmod +x "$REPO_ROOT/.githooks/"*

echo "Done. Git hooks installed from .githooks/"
echo "Verify with: git config --get core.hooksPath"
