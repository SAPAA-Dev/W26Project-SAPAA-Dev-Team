import { useId, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';

interface ListboxOptions<T> {
  options: readonly T[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onPick: (option: T) => void;
}

/**
 * The combobox pattern for a text input with a suggestion list. Arrow keys move
 * through the options, Enter picks the highlighted one and Escape closes the list.
 * Focus stays in the input, so a screen reader follows aria-activedescendant.
 */
export function useListbox<T>({ options, open, onOpen, onClose, onPick }: ListboxOptions<T>) {
  const listId = useId();
  const [active, setActive] = useState(-1);
  // The options change while the user types, so an old index can point past the end.
  const activeIndex = open && active < options.length ? active : -1;
  const optionId = (index: number) => `${listId}-option-${index}`;

  const pick = (option: T) => {
    setActive(-1);
    onPick(option);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (options.length === 0) return;
      event.preventDefault();
      if (!open) onOpen();
      const last = options.length - 1;
      if (event.key === 'ArrowDown') setActive(activeIndex >= last ? 0 : activeIndex + 1);
      else setActive(activeIndex <= 0 ? last : activeIndex - 1);
    } else if (event.key === 'Enter' && activeIndex !== -1) {
      event.preventDefault();
      pick(options[activeIndex]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setActive(-1);
      onClose();
    }
  };

  return {
    resetActive: () => setActive(-1),
    inputProps: {
      role: 'combobox' as const,
      'aria-autocomplete': 'list' as const,
      'aria-expanded': open,
      'aria-controls': listId,
      'aria-activedescendant': activeIndex === -1 ? undefined : optionId(activeIndex),
      onKeyDown,
    },
    listProps: { id: listId, role: 'listbox' as const },
    optionProps: (index: number) => ({
      id: optionId(index),
      role: 'option' as const,
      'aria-selected': index === activeIndex,
      // preventDefault keeps focus in the input, so its blur does not close the list first.
      onMouseDown: (event: MouseEvent) => event.preventDefault(),
      onClick: () => pick(options[index]),
    }),
  };
}
