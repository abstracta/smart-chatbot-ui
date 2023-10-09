import { Dispatch, createContext } from 'react';
import { ActionType } from '@/hooks/useCreateReducer';
import { ReportsInitialState } from './reports.state';

export interface ReportsContextProps {
  state: ReportsInitialState;
  dispatch: Dispatch<ActionType<ReportsInitialState>>;
}

const ReportsContext = createContext<ReportsContextProps>(undefined!);

export default ReportsContext;
