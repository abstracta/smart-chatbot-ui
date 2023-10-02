import { useCallback, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import { User } from '@/types/user';
import { updateOrInsertItem } from '@/utils/app/arrays';

type UserActions = {
  update: (user: User) => Promise<User>;
};

export default function useUsers(): [
  User[],
  UserActions,
] {
  const trpcContext = trpc.useContext();
  const usersQuery = trpc.users.list.useQuery();
  const updateUser = trpc.users.update.useMutation({
    onMutate: async (updatedUser: User) => {
      const listQuery = trpcContext.users.list;
      await listQuery.cancel();
      const previousData = listQuery.getData();
      listQuery.setData(undefined,
        (oldQueryData: User[] | undefined) =>
          updateOrInsertItem(oldQueryData, updatedUser, (a, b) => a._id == b._id, false));
      return { previousData };
    },
    onError: (err, input, context) => {
      trpcContext.users.list.setData(undefined, context?.previousData);
    },
    onSettled: () => {
      trpcContext.users.list.invalidate();
    },
  });

  useEffect(() => {
    if (usersQuery.data) {
      const data = usersQuery.data;
      console.log()
    }
  }, [usersQuery.data])

  const update = useCallback(
    async (user: User) => {
      await updateUser.mutateAsync(user);
      return user;
    },
    [updateUser],
  );

  return [
    usersQuery.data || [],
    {
      update,
    },
  ];
}
