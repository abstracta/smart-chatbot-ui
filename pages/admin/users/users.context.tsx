import { Dispatch, createContext } from 'react';
import { ActionType } from '@/hooks/useCreateReducer';
import { UsersInitialState } from './users.state';

export interface UsersContextProps {
  state: UsersInitialState;
  dispatch: Dispatch<ActionType<UsersInitialState>>;
}

const UsersContext = createContext<UsersContextProps>(undefined!);

export default UsersContext;
