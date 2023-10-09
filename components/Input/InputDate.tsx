import { FC } from 'react';

interface Props {
  placeholder?: string;
  id?: string;
  value?: Date;
  min?: Date;
  max?: Date;
  onChange?(value: Date): void;
  disabled?: boolean;
}

export const InputDate: FC<Props> = ({
  placeholder,
  id,
  value,
  min,
  max,
  onChange,
  disabled,
}) => {
  return (
    <input type='date'
      className='bg-transparent p-2 dark:[color-scheme:dark] rounded border 
        hover:bg-black/10 dark:hover:bg-white/10 dark:border-white/20 transition
        disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-300 
        dark:disabled:bg-gray-500 dark:disabled:text-gray-600 dark:disabled:border-gray-500'
      placeholder={placeholder}
      id={id}
      value={value?.toISOString().slice(0, 10)}
      min={min?.toISOString().slice(0, 10)}
      max={max?.toISOString().slice(0, 10)}
      onChange={(e) => (onChange && e.target?.value) &&
        onChange(new Date(e.target?.value))}
      disabled={disabled}
    />)
};
