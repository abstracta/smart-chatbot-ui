import { UserInfoDb, getDb } from '@/utils/server/storage';
import { adminProcedure, router } from '../trpc';
import { UserSchema } from '@/types/user';

export const users = router({
  list: adminProcedure.query(async () => {
    const userInfoDB = new UserInfoDb(await getDb());
    return await userInfoDB.getUsers();
  }),
  update: adminProcedure
    .input(UserSchema)
    .mutation(async ({ input }) => {
      const userInfoDB = new UserInfoDb(await getDb());
      await userInfoDB.saveUser(input);
      return { success: true };
    }),
});
