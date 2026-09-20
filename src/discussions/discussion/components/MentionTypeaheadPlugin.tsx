import { useCallback, useMemo, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import {
  COMMAND_PRIORITY_HIGH,
  $createTextNode,
  type TextNode,
} from "lexical";
import {
  filterMentionPeople,
  type MentionPerson,
} from "@/discussions/model/mentions";
import { TypeaheadPopup } from "@/ui/AnchoredPopup";
import { $createMentionNode } from "./MentionNode";
import { MentionPicker } from "./MentionPicker";

class MentionOption extends MenuOption {
  person: MentionPerson;

  constructor(person: MentionPerson) {
    super(person.userId);
    this.person = person;
  }
}

export function MentionTypeaheadPlugin({
  people,
  excludeUserId,
  loading = false,
}: {
  people: MentionPerson[];
  excludeUserId?: string;
  loading?: boolean;
}) {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch("@", {
    minLength: 0,
  });

  const filtered = useMemo(
    () =>
      queryString == null
        ? []
        : filterMentionPeople(people, queryString, excludeUserId),
    [people, queryString, excludeUserId],
  );
  const options = useMemo(
    () => filtered.map((person) => new MentionOption(person)),
    [filtered],
  );

  const onSelectOption = useCallback(
    (
      option: MentionOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const mention = $createMentionNode(
          option.person.userId,
          option.person.name,
        );
        if (nodeToReplace) {
          nodeToReplace.replace(mention);
        }
        mention.insertAfter($createTextNode(" "));
        mention.selectNext();
      });
      closeMenu();
    },
    [editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin<MentionOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForTriggerMatch}
      options={options}
      preselectFirstItem
      commandPriority={COMMAND_PRIORITY_HIGH}
      menuRenderFn={(
        anchorRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        const anchor = anchorRef.current;
        if (!anchor) return null;
        return (
          <TypeaheadPopup
            anchor={anchor}
            className="cw-slash-menu"
            label="Mention someone"
          >
            <MentionPicker
              people={filtered}
              selectedIndex={selectedIndex ?? 0}
              loading={loading}
              onHover={setHighlightedIndex}
              onSelect={(person) => {
                const option = options.find(
                  (item) => item.person.userId === person.userId,
                );
                if (option) selectOptionAndCleanUp(option);
              }}
            />
          </TypeaheadPopup>
        );
      }}
    />
  );
}
