import { useCallback, useMemo, useState, type JSX } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import type { TextNode } from "lexical";
import {
  LinkIcon,
  MinusIcon,
  PaperClipIcon,
  QuestionMarkCircleIcon,
  TableCellsIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";
import {
  filterSlashOptions,
  slashTableChoices,
  type SlashQueryOption,
} from "@/materials/model/pageEditor";
import { BLOCK_ICONS, BLOCK_LABELS, BLOCK_TYPES } from "./blockTypes";
import { usePageEditorActions } from "./PageEditorActions";

class SlashOption extends MenuOption {
  title: string;
  keywords: string[];
  glyph: JSX.Element;
  onSelect: () => void;

  constructor(option: {
    id: string;
    title: string;
    keywords: string[];
    glyph: JSX.Element;
    onSelect: () => void;
  }) {
    super(option.id);
    this.title = option.title;
    this.keywords = option.keywords;
    this.glyph = option.glyph;
    this.onSelect = option.onSelect;
  }
}

export function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const actions = usePageEditorActions();
  const [queryString, setQueryString] = useState<string | null>(null);
  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });

  const baseOptions = useMemo(() => {
    const blocks: SlashQueryOption[] = BLOCK_TYPES.map((type) => ({
      id: type,
      title: BLOCK_LABELS[type],
      keywords:
        type === "paragraph"
          ? ["text", "normal", "paragraph"]
          : type === "ul"
            ? ["list", "bullet", "unordered"]
            : type === "ol"
              ? ["list", "numbered", "ordered"]
              : type === "quote"
                ? ["quote", "blockquote"]
                : ["heading", "title", type],
    }));
    const extra: SlashQueryOption[] = [
      { id: "table", title: "Table", keywords: ["table", "grid", "spreadsheet"] },
      { id: "link", title: "Link", keywords: ["url", "anchor"] },
      { id: "video", title: "Video", keywords: ["embed", "youtube"] },
      { id: "quiz", title: "Quiz", keywords: ["question", "test"] },
      { id: "divider", title: "Divider", keywords: ["line", "horizontal", "hr"] },
    ];
    if (actions.canAttachFile) {
      extra.splice(4, 0, {
        id: "file",
        title: "File",
        keywords: ["attach", "upload", "image"],
      });
    }
    return [...blocks, ...extra];
  }, [actions.canAttachFile]);

  const options = useMemo(() => {
    const query = queryString ?? "";
    const tables = slashTableChoices(query).map(
      (size) =>
        new SlashOption({
          id: `table-${size.rows}x${size.columns}`,
          title: `${size.rows}×${size.columns} table`,
          keywords: ["table"],
          glyph: <TableCellsIcon className="h-4 w-4" />,
          onSelect: () => actions.insertTable(size.rows, size.columns),
        }),
    );
    const filtered = filterSlashOptions(baseOptions, query);
    return [
      ...tables,
      ...filtered.map((option) => toSlashOption(option.id, actions)),
    ];
  }, [actions, baseOptions, queryString]);

  const onSelectOption = useCallback(
    (
      option: SlashOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        nodeToRemove?.remove();
      });
      closeMenu();
      queueMicrotask(() => {
        option.onSelect();
      });
    },
    [editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin<SlashOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
      options={options}
      preselectFirstItem
      menuRenderFn={(anchorRef, { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }) => {
        const anchor = anchorRef.current;
        if (!anchor || options.length === 0) return null;
        return createPortal(
          <div className="cw-slash-menu" role="listbox" aria-label="Insert a block">
            {options.map((option, index) => (
              <button
                key={option.key}
                type="button"
                role="option"
                aria-selected={selectedIndex === index}
                ref={(element) => option.setRefElement(element)}
                className={[
                  "cw-slash-item",
                  selectedIndex === index ? "is-active" : "",
                ].join(" ")}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => selectOptionAndCleanUp(option)}
              >
                <span className="cw-editor-menu-icon">{option.glyph}</span>
                <span>{option.title}</span>
              </button>
            ))}
          </div>,
          anchor,
        );
      }}
    />
  );
}

function toSlashOption(
  id: string,
  actions: ReturnType<typeof usePageEditorActions>,
): SlashOption {
  if (id === "table") {
    return new SlashOption({
      id,
      title: "Table",
      keywords: ["table"],
      glyph: <TableCellsIcon className="h-4 w-4" />,
      onSelect: actions.openTableDialog,
    });
  }
  if (id === "link") {
    return new SlashOption({
      id,
      title: "Link",
      keywords: ["link"],
      glyph: <LinkIcon className="h-4 w-4" />,
      onSelect: () => actions.openLinkDialog(),
    });
  }
  if (id === "video") {
    return new SlashOption({
      id,
      title: "Video",
      keywords: ["video"],
      glyph: <VideoCameraIcon className="h-4 w-4" />,
      onSelect: actions.openVideoDialog,
    });
  }
  if (id === "quiz") {
    return new SlashOption({
      id,
      title: "Quiz",
      keywords: ["quiz"],
      glyph: <QuestionMarkCircleIcon className="h-4 w-4" />,
      onSelect: actions.insertQuiz,
    });
  }
  if (id === "file") {
    return new SlashOption({
      id,
      title: "File",
      keywords: ["file", "audio", "mp3", "m4a", "pdf", "attach"],
      glyph: <PaperClipIcon className="h-4 w-4" />,
      onSelect: actions.attachFile,
    });
  }
  if (id === "divider") {
    return new SlashOption({
      id,
      title: "Divider",
      keywords: ["divider"],
      glyph: <MinusIcon className="h-4 w-4" />,
      onSelect: actions.insertDivider,
    });
  }
  const block = BLOCK_TYPES.find((type) => type === id) ?? "paragraph";
  const Icon = BLOCK_ICONS[block];
  return new SlashOption({
    id: block,
    title: BLOCK_LABELS[block],
    keywords: [block],
    glyph: <Icon className="h-4 w-4" />,
    onSelect: () => actions.setBlock(block),
  });
}
