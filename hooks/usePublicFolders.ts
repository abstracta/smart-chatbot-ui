import { useCallback, useContext } from 'react';
import { FolderInterface, FolderSchema, FolderType } from '@/types/folder';
import HomeContext from '@/pages/api/home/home.context';
import { trpc } from '@/utils/trpc';
import { v4 as uuidv4 } from 'uuid';


type PublicFoldersAction = {
  update: (newState: FolderInterface) => Promise<FolderInterface[]>;
  add: (name: string) => Promise<FolderInterface[]>;
  remove: (folderId: string) => Promise<FolderInterface[]>;
};

export default function usePublicFolders(): [FolderInterface[], PublicFoldersAction] {
  const publicPromptsList = trpc.publicPrompts.list.useQuery();
  const folderUpdate = trpc.publicFolders.update.useMutation();
  const folderRemove = trpc.publicFolders.remove.useMutation();
  const {
    state: { publicFolders, publicPrompts },
    dispatch,
  } = useContext(HomeContext);

  const add = useCallback(
    async (name: string) => {
      const newFolder: FolderInterface = FolderSchema.parse({
        id: uuidv4(),
        name,
        type: "prompt"
      });
      const newState = [newFolder, ...publicFolders];
      await folderUpdate.mutateAsync(newFolder);
      dispatch({ field: 'publicFolders', value: newState });
      return newState;
    },
    [dispatch, folderUpdate, publicFolders],
  );

  const update = useCallback(
    async (folder: FolderInterface) => {
      const newState = publicFolders.map((f) => f.id === folder.id ? folder : f);
      await folderUpdate.mutateAsync(folder);
      dispatch({ field: 'publicFolders', value: newState });
      return newState;
    },
    [dispatch, folderUpdate, publicFolders],
  );

  const remove = useCallback(
    async (folderId: string) => {
      const newState = publicFolders.filter((f) => f.id !== folderId);
      await folderRemove.mutateAsync({ id: folderId });
      dispatch({ field: 'publicFolders', value: newState });

      const updatedPrompts = publicPromptsList.data;
      dispatch({ field: 'publicPrompts', value: updatedPrompts });
      return newState;
    },
    [
      dispatch,
      folderRemove,
      publicFolders,
      publicPrompts,
    ],
  );

  return [
    publicFolders,
    {
      add,
      update,
      remove,
    },
  ];
}
