import { useCallback, useContext } from 'react';
import { FolderInterface, FolderSchema, FolderType } from '@/types/folder';
import HomeContext from '@/pages/api/home/home.context';
import { trpc } from '@/utils/trpc';
import { v4 as uuidv4 } from 'uuid';
import { updateOrInsertItem } from '@/utils/app/arrays';


type PublicFoldersAction = {
  update: (newState: FolderInterface) => Promise<FolderInterface[]>;
  add: (name: string) => Promise<FolderInterface>;
  remove: (folderId: string) => Promise<FolderInterface[]>;
};

export default function usePublicFolders(): [FolderInterface[], PublicFoldersAction] {
  const publicPromptsListQuery = trpc.publicPrompts.list.useQuery();
  const trpcContext = trpc.useContext();

  const folderUpdate = trpc.publicFolders.update.useMutation({
    onMutate: async (folder: FolderInterface) => {
      const listQuery = trpcContext.publicFolders.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined,
        (oldQueryData: FolderInterface[] | undefined) =>
          updateOrInsertItem(oldQueryData, folder, (a, b) => a.id == b.id)
            .sort((a, b) => a.name > b.name ? 1 : -1)
      )
      return { previousData };
    },
    onError: (err, input, context) => {
      trpcContext.publicFolders.list.setData(undefined, context?.previousData);
    },
    onSettled: () => {
      trpcContext.publicFolders.list.invalidate();
    },
  });
  const folderRemove = trpc.publicFolders.remove.useMutation({
    onMutate: async ({ id }) => {
      const listQuery = trpcContext.publicFolders.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined,
        (oldQueryData: FolderInterface[] | undefined) =>
          oldQueryData && oldQueryData.filter(f => f.id !== id) || []
      )
      return { previousData };
    },
    onError: (err, input, context) => {
      trpcContext.publicFolders.list.setData(undefined, context?.previousData);
    },
    onSettled: () => {
      trpcContext.publicFolders.list.invalidate();
    },
  });

  const {
    state: { publicFolders },
    dispatch,
  } = useContext(HomeContext);

  const add = useCallback(
    async (name: string) => {
      const newFolder: FolderInterface = FolderSchema.parse({
        id: uuidv4(),
        name,
        type: "prompt"
      });
      await folderUpdate.mutateAsync(newFolder);
      return newFolder;
    },
    [dispatch, folderUpdate],
  );

  const update = useCallback(
    async (folder: FolderInterface) => {
      await folderUpdate.mutateAsync(folder);
      return publicFolders.map((f) => f.id === folder.id ? folder : f);
    },
    [dispatch, folderUpdate, publicFolders],
  );

  const remove = useCallback(
    async (folderId: string) => {
      await folderRemove.mutateAsync({ id: folderId });
      publicPromptsListQuery.refetch();
      return publicFolders.filter((f) => f.id !== folderId);
    },
    [
      dispatch,
      folderRemove,
      publicFolders,
      publicPromptsListQuery,
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
