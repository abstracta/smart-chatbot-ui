import { useCallback, useContext } from 'react';

import { trpc } from '@/utils/trpc';

import { Conversation } from '@/types/chat';
import { FolderInterface, FolderType } from '@/types/folder';
import { Prompt } from '@/types/prompt';

import HomeContext from '@/pages/api/home/home.context';

import { v4 as uuidv4 } from 'uuid';
import useConversations from './useConversations';
import { updateOrInsertItem } from '@/utils/app/arrays';
import usePrompts from './usePrompts';

type FoldersAction = {
  update: (newState: FolderInterface) => Promise<FolderInterface>;
  updateAll: (newState: FolderInterface[]) => Promise<FolderInterface[]>;
  add: (name: string, type: FolderType) => Promise<FolderInterface>;
  remove: (folderId: string) => Promise<FolderInterface[]>;
  clear: () => Promise<FolderInterface[]>;
};

export default function useFolders(): [FolderInterface[], FoldersAction] {

  const { updateAll: conversationsUpdateAll } = useConversations()[1];
  const { updateAll: promptsUpdateAll } = usePrompts()[1];
  const trpcContext = trpc.useContext();

  const folderUpdateAll = trpc.folders.updateAll.useMutation({
    onMutate: async (folders: FolderInterface[]) => {
      const listQuery = trpcContext.folders.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined, folders);
      return { previousData };
    },
    onError: (err, input, context) => {
      trpcContext.folders.list.setData(undefined, context?.previousData);
    },
    onSettled: () => {
      trpcContext.folders.list.invalidate();
    },
  });

  const folderUpdate = trpc.folders.update.useMutation({
    onMutate: async (folder: FolderInterface) => {
      const listQuery = trpcContext.folders.list;
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
      trpcContext.folders.list.setData(undefined, context?.previousData);
    },
    onSettled: () => {
      trpcContext.folders.list.invalidate();
    },
  });

  const folderRemove = trpc.folders.remove.useMutation({
    onMutate: async ({ id }) => {
      const listQuery = trpcContext.folders.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined,
        (oldQueryData: FolderInterface[] | undefined) =>
          oldQueryData?.filter((f) => f.id !== id) || [])
      return { previousData };
    },
    onError: (err, input, context) => {
      trpcContext.folders.list.setData(undefined, context?.previousData);
    },
    onSettled: () => {
      trpcContext.folders.list.invalidate();
    },
  });

  const folderRemoveAll = trpc.folders.removeAll.useMutation({
    onMutate: async () => {
      const listQuery = trpcContext.folders.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined, [])
      return { previousData };
    },
    onError: (err, input, context) => {
      trpcContext.folders.list.setData(undefined, context?.previousData);
    },
    onSettled: () => {
      trpcContext.folders.list.invalidate();
    },
  });

  const {
    state: { folders, conversations, prompts },
    dispatch,
  } = useContext(HomeContext);

  const updateAll = useCallback(
    async (updated: FolderInterface[]): Promise<FolderInterface[]> => {
      await folderUpdateAll.mutateAsync(updated);
      return updated;
    },
    [dispatch, folderUpdateAll],
  );

  const add = useCallback(
    async (name: string, type: FolderType) => {
      const newFolder: FolderInterface = {
        id: uuidv4(),
        name,
        type,
      };
      await folderUpdate.mutateAsync(newFolder);
      return newFolder;
    },
    [dispatch, folderUpdate, folders],
  );

  const update = useCallback(
    async (folder: FolderInterface) => {
      await folderUpdate.mutateAsync(folder);
      return folder;
    },
    [dispatch, folderUpdate, folders],
  );

  const clear = useCallback(async () => {
    const newState = folders.filter((f) => f.type !== 'chat');
    await folderRemoveAll.mutateAsync({ type: 'chat' });
    dispatch({ field: 'folders', value: newState });
    return newState;
  }, [dispatch, folderRemoveAll, folders]);

  const remove = useCallback(
    async (folderId: string) => {
      await folderRemove.mutateAsync({ id: folderId });

      const updatedConversations: Conversation[] = conversations.map((c) => {
        if (c.folderId === folderId) {
          return {
            ...c,
            folderId: null,
          };
        }
        return c;
      });
      conversationsUpdateAll(updatedConversations);

      const updatedPrompts: Prompt[] = prompts.map((p) => {
        if (p.folderId === folderId) {
          return {
            ...p,
            folderId: null,
          };
        }

        return p;
      });
      promptsUpdateAll(updatedPrompts);

      return folders.filter((f) => f.id !== folderId);
    },
    [
      conversations,
      dispatch,
      folderRemove,
      folders,
      prompts,
      conversationsUpdateAll,
      promptsUpdateAll,
    ],
  );

  return [
    folders,
    {
      add,
      update,
      updateAll,
      remove,
      clear,
    },
  ];
}
