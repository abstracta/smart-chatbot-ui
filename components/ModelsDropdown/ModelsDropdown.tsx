import { FC } from 'react';
import Dropdown from '../Buttons/Dropdown';
import { DropdownItem } from '../Buttons/Dropdown/DropItem';
import { IconCaretDown } from '@tabler/icons-react';
import { Llm, LlmID } from '@/types/llm';
import { useTranslation } from 'next-i18next';
import { DropdownItemCheck } from '../Buttons/Dropdown/DropdownItemCheck';

interface Props {
  models: Llm[];
  selectedModels?: Llm[];
  disabledModels?: Llm[];
  disabledText?: string;
  onChange(selectedModels: Llm[]): void;
}

export const ModelsDropdown: FC<Props> = ({
  models: modelsList,
  selectedModels,
  disabledModels,
  disabledText,
  onChange,
}) => {
  const { t } = useTranslation('common');

  const models = modelsList.reduce((prev, curr) => {
    prev[curr.id] = selectedModels?.some(m => m.id == curr.id) || false;
    return prev;
  }, {} as Record<LlmID, boolean>);

  const enabledModels = modelsList.filter(m => !disabledModels?.some(d => d.id == m.id));

  const handleChange = (id: LlmID, enabled: boolean) => {
    const newState = { ...models, [id]: enabled };
    onChange(modelsList.filter(m => newState[m.id]));
  }

  const handleSelectAll = (select: boolean) => {
    const selected = select ? enabledModels : [];
    onChange(selected);
  }

  return (
    <Dropdown buttonContent={
      <span className='flex gap-2'>
        <span className='flex'>
          {t("Models")} (<span className='inline-block w-10 text-center'>{
            Object.values(models).filter(Boolean).length}
            /
            {Object.keys(models).filter(m => !disabledModels?.some(d => d.id == m)).length}
          </span>)
        </span>
        <IconCaretDown size={18} />
      </span>}
      items={[
        <DropdownItemCheck
          key="select-all"
          label={t("Select all") as string}
          id="select-all"
          selected={Object.values(models).filter(m => m).length == enabledModels?.length}
          disabled={false}
          onChange={handleSelectAll}
          readonly={true}
        />,
        ...Object.entries(models)
          .filter(([id, selected]) => !disabledModels?.some(m => m.id == id))
          .sort(([idA, selectedA], [idB, selectedB]) => idA.localeCompare(idB))
          .map(([id, selected]) => {
            return (
              <DropdownItemCheck
                key={id}
                label={modelsList.find(m => m.id == id)?.name}
                id={id}
                selected={selected}
                disabled={false}
                onChange={(selected) => handleChange(id as LlmID, selected)}
                readonly={true}
              />)
          }),
        <li key="divider-1"><hr className=' my-1 border-gray-600' />
          <span className='px-4 text-xs text-gray-400'>{disabledText}</span>
        </li>,
        ...Object.entries(models)
          .filter(([id, selected]) => disabledModels?.some(m => m.id == id))
          .sort(([idA, selectedA], [idB, selectedB]) => idA.localeCompare(idB))
          .map(([id, selected]) => {
            return (
              <DropdownItemCheck
                key={id}
                label={modelsList.find(m => m.id == id)?.name}
                id={id}
                selected={selected}
                disabled={true}
                onChange={(selected) => handleChange(id as LlmID, selected)}
                readonly={true}
              />)
          })
      ]}
      align='right'
      disabled={false}
      hideOnClick={false}
    />
  );
}; 