import { FC } from 'react';
import { DropdownItem } from './DropItem';
import { randomUUID } from 'crypto';


type Props = {
  label?: string,
  id?: string,
  selected?: boolean,
  disabled?: boolean,
  readonly?: boolean,
  onChange?(selected: boolean): void,
  onInputClick?(): void,
}

export const DropdownItemCheck: FC<Props> = ({
  label: name, id, selected, disabled,
  readonly, onChange, onInputClick
}) => {
  const uid = id || randomUUID();

  return (
    <DropdownItem
      onClick={() => onChange && onChange(!selected)}
      disabled={disabled}
    >
      <div className="flex items-center">
        <input id={`checkbox-item-${uid}`} type="checkbox" checked={selected} readOnly={readonly}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 
              dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 
              focus:ring-2 dark:bg-gray-600 dark:border-gray-500  cursor-pointer"
          disabled={disabled}
          onClick={onInputClick || ((e) => e.preventDefault())}
        />
        <label htmlFor={`checkbox-item-${uid}`}
          className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer whitespace-nowrap"
          onClick={onInputClick || ((e) => e.preventDefault())}
        >
          {name}
        </label>
      </div>
    </DropdownItem>
  )
}
