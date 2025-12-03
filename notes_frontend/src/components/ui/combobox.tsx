import { useEffect, useState } from "react";

import {
  Check,
  ChevronsUpDown,
  CirclePlus,
  XCircle,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type ComboboxOptions = {
  value: string;
  label: string;
  isCreatable?: boolean;
};

interface ComboboxProps {
  options: ComboboxOptions[];
  selected: ComboboxOptions["value"][];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (selectedValues: ComboboxOptions["value"][]) => void;
  onCreate?: (label: ComboboxOptions["label"]) => void;
  onRemove?: (value: ComboboxOptions["value"]) => void;
}

function CommandAddItem({
  query,
  onCreate,
}: {
  query: string;
  onCreate: () => void;
}) {
  return (
    <div
      tabIndex={0}
      onClick={onCreate}
      onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter") {
          onCreate();
        }
      }}
      className={cn(
        "flex w-full text-blue-500 cursor-pointer text-sm px-2 py-1.5 rounded-sm items-center focus:outline-none",
        "hover:bg-blue-200 focus:!bg-blue-200",
      )}
    >
      <CirclePlus className="mr-2 h-4 w-4" />
      Create "{query}"
    </div>
  );
}

export function Combobox({
  options,
  selected,
  className,
  placeholder,
  disabled,
  onChange,
  onCreate,
  onRemove,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const [canCreate, setCanCreate] = useState(true);

  useEffect(() => {
    const isAlreadyCreated = options.some((option) => option.label === query);
    setCanCreate(!!(query && !isAlreadyCreated));
  }, [query, options]);

  function handleSelect(option: ComboboxOptions) {
    if (onChange) {
      const isSelected = selected.includes(option.value);
      let newSelected: string[];

      if (isSelected) {
        newSelected = selected.filter((value) => value !== option.value);
      } else {
        newSelected = [...selected, option.value];
      }
      onChange(newSelected);
      setQuery("");
    }
  }

  function handleCreate() {
    if (onCreate && query) {
      onCreate(query);
      setOpen(false);
      setQuery("");
    }
  }

  function handleRemoveSelected(valueToRemove: string) {
    onChange(selected.filter((value) => value !== valueToRemove));
  }

  function handleRemoveOption(event: React.MouseEvent, valueToRemove: string) {
    event.stopPropagation();
    // console.log("Combobox: Calling onRemove for value:", valueToRemove);
    if (onRemove) {
      onRemove(valueToRemove);
    } else {
      console.warn(
        "Combobox: onRemove prop not provided to Combobox when trash icon clicked!",
      );
    }
  }

  const selectedOptions = options.filter((option) =>
    selected.includes(option.value),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled ?? false}
          aria-expanded={open}
          className={cn(
            "w-full font-normal justify-between h-auto min-h-[40px] flex-wrap",
            "relative",
            className,
          )}
        >
          {selectedOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1 pr-8">
              {selectedOptions.map((item) => (
                <Badge
                  key={item.value}
                  variant="secondary"
                  className="flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSelected(item.value);
                  }}
                >
                  {item.label}
                  <XCircle className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" />
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-slate-600 mr-auto">
              {placeholder ?? "Select items..."}
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 " />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[500px] p-0">
        <Command>
          <CommandInput
            placeholder="Search or create new"
            value={query}
            onValueChange={(value: string) => setQuery(value)}
          />
          <CommandEmpty className="flex pl-1 py-1 w-full">
            {query && (
              <CommandAddItem query={query} onCreate={() => handleCreate()} />
            )}
          </CommandEmpty>

          <CommandList>
            <CommandGroup className="overflow-y-auto">
              {options.length === 0 && !query && (
                <div className="py-1.5 pl-8 space-y-1 text-sm">
                  <p>No items</p>
                  <p>Enter a value to create a new one</p>
                </div>
              )}

              {canCreate && (
                <CommandAddItem query={query} onCreate={() => handleCreate()} />
              )}

              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    handleSelect(option);
                  }}
                  className={cn(
                    "cursor-pointer flex justify-between items-center",
                    "focus:!bg-blue-200 hover:!bg-blue-200 aria-selected:bg-transparent",
                  )}
                >
                  <div className="flex items-center flex-grow">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 min-h-4 min-w-4",
                        selected.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {option.label}
                  </div>
                  {onRemove && option.isCreatable && (
                    <Button // <--- Use Button here
                      variant="ghost" // Makes it look like just an icon, no strong background
                      size="icon" // Makes it a small, square button
                      className="h-6 w-6" // Optional: Adjust size if needed (default `size="icon"` might be slightly larger)
                      onClick={(e) => {
                        e.stopPropagation(); // STILL CRUCIAL to prevent CommandItem's onSelect
                        handleRemoveOption(e, option.value);
                      }}
                      aria-label={`Remove ${option.label}`} // Good for accessibility
                    >
                      <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />{" "}
                      {/* Icon inside the button */}
                    </Button>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
