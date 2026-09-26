# AGENTS — `src/materials/material/components/page-editor/`

Lexical page editor chrome: icon toolbar, slash menu, insert dialogs, floating format bar.

## Scope

- Playground-style **icon** toolbar (not word buttons); optional trailing **Version history** (material edit)
- Notion-like **/** slash commands and markdown shortcuts
- Popups for table size, link URL, video URL, and **audio** (upload or record via `AudioSnippetRecorder`)
- Paste image → upload via `materials/databridge` (same path as `/file`)
- Course Wright tokens and Heroicons only

## Don’t

- Add editor features that aren’t in FEATURES (no code blocks, colors, or checklists unless the spec changes). **Font family**, **font size**, **line spacing**, and **paragraph alignment** are supported on the toolbar.
- Call Supabase from these files except through `materials/databridge`
- Invent a separate Lexical audio node — recorded/uploaded audio becomes an in-page `file` node
