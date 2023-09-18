import { FC } from 'react';

interface Props {
  placeholder?: string;
  options: {
    value: string,
    label: string
  }[],
  selectedValue?: string;
  onSelect(modelId: string): void;
}

export const Select: FC<Props> = ({
  placeholder,
  options,
  selectedValue,
  onSelect
}) => {

  return (
    <div className="w-full rounded-lg border border-neutral-200 bg-transparent pr-2 text-neutral-900 dark:border-neutral-600 dark:text-white">
      <select
        className="w-full bg-transparent p-2"
        placeholder={placeholder || ''}
        value={selectedValue}
        onChange={(e) => onSelect(e.target.value)}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="dark:bg-[#343541] dark:text-white"
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
