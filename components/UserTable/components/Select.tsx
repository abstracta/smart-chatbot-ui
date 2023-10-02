import { FC } from 'react';

interface Props {
  placeholder?: string;
  options: {
    value: string,
    label: string
  }[],
  value?: string;
  onSelect(modelId: string): void;
}

export const Select: FC<Props> = ({
  placeholder,
  options,
  value,
  onSelect
}) => {

  return (
    <select
      className="bg-transparent p-2"
      placeholder={placeholder || ''}
      value={value}
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
  );
};
