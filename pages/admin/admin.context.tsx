import { Dispatch, createContext } from 'react';
import { ActionType } from '@/hooks/useCreateReducer';
import { AdminInitialState } from './admin.state';

export interface AdminContextProps {
  state: AdminInitialState;
  dispatch: Dispatch<ActionType<AdminInitialState>>;
}

const AdminContext = createContext<AdminContextProps>(undefined!);

export default AdminContext;
