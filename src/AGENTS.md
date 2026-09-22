# AGENTS — `src/`

SPA root. **Screaming Architecture:** domain folders at this level scream Course Wright. Frameworks whisper in `app/`, `ui/`, `infrastructure/`.

## Do

- Put product code in a **domain folder** (`courses/`, `resources/`, `roster/`, `print/`, …).
- Follow the nearest domain `AGENTS.md`.
- One SPA for admin / instructor / parent — role chrome in `app/layouts/`.

## Don’t

- Add top-level `components/`, `hooks/`, `services/`, `features/` wrappers.
- Put business rules in `infrastructure/`.
- Create a second app for parents.

## See also

- [ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [STRUCTURE.md](../docs/STRUCTURE.md)
- [AGENTS.md](../AGENTS.md) (index)
