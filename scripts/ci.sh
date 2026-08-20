#!/usr/bin/env bash
#
# Full verification gate. Runs every check CI runs, in the same order, so a
# green run here means a green run on the pipeline.
#
#   ./scripts/ci.sh              # everything
#   ./scripts/ci.sh --fast       # skip the production build (pre-commit loop)
#   ./scripts/ci.sh --coverage   # unit tests with a coverage report
#
set -euo pipefail

FAST=0
COVERAGE=0
for arg in "$@"; do
  case "$arg" in
    --fast) FAST=1 ;;
    --coverage) COVERAGE=1 ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

# Date formatting ("en-MY") and the billing-cycle maths are timezone sensitive.
# Pinning TZ keeps assertions identical on a laptop and on a UTC CI runner.
export TZ="${TZ_OVERRIDE:-Asia/Kuala_Lumpur}"

# `next build` and `tsc` need these present, but never connect during CI —
# every page that touches the database is dynamic. Real values come from the
# environment when set (e.g. a local .env), placeholders otherwise.
export DATABASE_URL="${DATABASE_URL:-postgresql://ci:ci@localhost:5432/ci?schema=public}"
export AUTH_SECRET="${AUTH_SECRET:-ci-placeholder-secret-32-bytes-min}"

step() { printf '\n\033[1;34m▸ %s\033[0m\n' "$1"; }

# The Prisma client is generated into src/generated/prisma, which is gitignored.
# Nothing typechecks until it exists, so this has to come first.
step "Generating Prisma client"
npx prisma generate

step "Validating Prisma schema"
npx prisma validate

# `next dev`/`next build` generate next-env.d.ts and the route-aware globals
# (LayoutProps, PageProps, RouteContext) into .next/types. A fresh checkout has
# neither, so typechecking before the build fails on a clean machine even though
# it passes on one that has built before. `typegen` produces them without a
# full build.
step "Generating Next.js route types"
npx next typegen

step "Linting"
npm run lint

step "Typechecking"
npx tsc --noEmit

step "Unit tests"
if [ "$COVERAGE" -eq 1 ]; then
  npx vitest run --coverage
else
  npx vitest run
fi

if [ "$FAST" -eq 1 ]; then
  step "Skipping production build (--fast)"
else
  step "Production build"
  npm run build
fi

printf '\n\033[1;32m✓ All checks passed\033[0m\n'
