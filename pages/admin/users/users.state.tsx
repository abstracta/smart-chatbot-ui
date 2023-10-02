

export interface UsersInitialState {
  defaultUserLimitUSD: number | undefined;
  canUpdateUserQuotas: boolean;
}

export const initialState: Partial<UsersInitialState> = {
  defaultUserLimitUSD: undefined,
  canUpdateUserQuotas: false
};
