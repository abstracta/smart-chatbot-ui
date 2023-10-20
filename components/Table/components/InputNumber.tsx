import { FC, useEffect, useState } from 'react';

interface Props {
  placeholder?: string;
  initialValue?: number;
  onChange(value: number): void;
}

export const InputNumber: FC<Props> = ({
  placeholder,
  initialValue,
  onChange
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleBlur = () => {
    if (value) onChange(value);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLElement).blur();
    }
  }

  return (
    <input
      type='number'
      min="0.0"
      step="0.1"
      className="bg-transparent"
      placeholder={placeholder}
      value={value}
      onKeyDown={handleKeyDown}
      onChange={e => setValue(Number(e.target.value))}
      onBlur={handleBlur}
    />
  );
};
