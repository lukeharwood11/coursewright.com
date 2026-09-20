#!/usr/bin/env bash
# Wipe Supabase schema + migration history and re-apply local migrations.
# Experiment mode only — see root AGENTS.md § Experiment mode.
#
# Usage:
#   ./scripts/nuke.sh                 # linked remote project (default; refuses parent/main)
#   ./scripts/nuke.sh --local         # local Docker stack
#   ./scripts/nuke.sh --yes           # skip confirmation (testing/local only)
#   ./scripts/nuke.sh --local --yes
#   ./scripts/nuke.sh --production    # parent/main; must type NUKE PRODUCTION
#
# Prefer linking to the **testing branch** project ref (Terraform output
# supabase_project_ref for tier=testing). Refuses parent/main unless
# --production is passed. Use --local for Docker.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/terraform-env.sh
source "${SCRIPT_DIR}/lib/terraform-env.sh"

cd "$REPO_ROOT"

TARGET="linked"
ASSUME_YES=0

usage() {
  cat <<'EOF'
Wipe Supabase schema + migration history and re-apply local migrations.
Experiment mode only — see root AGENTS.md § Experiment mode.

Usage:
  ./scripts/nuke.sh                 # linked remote (testing branch)
  ./scripts/nuke.sh --local         # local Docker stack
  ./scripts/nuke.sh --yes           # skip confirmation (testing/local only)
  ./scripts/nuke.sh --local --yes
  ./scripts/nuke.sh --production    # parent/main; type NUKE PRODUCTION

Refuses the parent/main project (hlecttkgrfhtzvwnxtyb) unless --production.
Link the testing branch ref first, or pass --local / --production.
EOF
}

for arg in "$@"; do
  case "$arg" in
    --local) TARGET="local" ;;
    --linked) TARGET="linked" ;;
    --production) TARGET="production" ;;
    --yes|-y) ASSUME_YES=1 ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! command -v supabase >/dev/null 2>&1; then
  echo "error: supabase CLI not found on PATH" >&2
  exit 1
fi

if [[ "$TARGET" == "local" ]]; then
  DEST="local database"
  RESET_ARGS=(--local --yes)
elif [[ "$TARGET" == "production" ]]; then
  PARENT_REF="$DEFAULT_SUPABASE_PARENT_PROJECT_REF"
  echo "→ supabase link --project-ref ${PARENT_REF}"
  supabase link --project-ref "$PARENT_REF" --yes
  DEST="production/main project ${PARENT_REF}"
  RESET_ARGS=(--linked --yes)
else
  if [[ ! -f supabase/.temp/project-ref ]]; then
    echo "error: no linked project (run: supabase link)" >&2
    exit 1
  fi
  REF="$(tr -d '[:space:]' < supabase/.temp/project-ref)"
  if [[ "$REF" == "$DEFAULT_SUPABASE_PARENT_PROJECT_REF" ]]; then
    echo "error: refusing to nuke parent/main project ${REF}" >&2
    echo "Link the testing branch, or pass --production / --local." >&2
    exit 1
  fi
  DEST="linked remote project ${REF}"
  RESET_ARGS=(--linked --yes)
fi

echo "⚠  Experiment-mode nuke: this DROPS all app data and schema on ${DEST},"
echo "   then re-applies migrations under supabase/migrations/."
echo

if [[ "$TARGET" == "production" ]]; then
  read -r -p "Type NUKE PRODUCTION to continue: " confirm
  if [[ "$confirm" != "NUKE PRODUCTION" ]]; then
    echo "Aborted."
    exit 1
  fi
elif [[ "$ASSUME_YES" -ne 1 ]]; then
  read -r -p "Type NUKE to continue: " confirm
  if [[ "$confirm" != "NUKE" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

echo "→ supabase db reset ${RESET_ARGS[*]}"
supabase db reset "${RESET_ARGS[@]}"

echo
echo "Done. Schema matches current local migrations on ${DEST}."
echo "If you deleted migration files first, the DB is empty aside from seed.sql — add new migrations next."
