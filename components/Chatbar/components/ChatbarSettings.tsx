import {
  IconAdjustments,
  IconSettings,
} from '@tabler/icons-react';
import { useContext, useState } from 'react';

import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';

import { SettingDialog } from '@/components/Settings/SettingDialog';

import { SidebarButton } from '../../Sidebar/SidebarButton';
import ChatbarContext from '../Chatbar.context';
import { ClearConversations } from './ClearConversations';
import { SidebarButtonLink } from '@/components/Sidebar/SidebarButtonLink';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types/user';

export const ChatbarSettings = () => {
  const { t } = useTranslation('sidebar');
  const [isSettingDialogOpen, setIsSettingDialog] = useState<boolean>(false);

  const {
    state: {
      conversations,
      folders
    },
  } = useContext(HomeContext);

  const session = useSession();
  const isAdmin = session.data?.user?.role === UserRole.ADMIN;

  const {
    handleClearConversations,
  } = useContext(ChatbarContext);

  return (
    <div className="flex flex-col items-center space-y-1 border-t border-white/20 pt-1 text-sm">
      {conversations.length > 0 || folders.find(f => f.type === "chat") ? (
        <ClearConversations onClearConversations={handleClearConversations} />
      ) : null}

      <SidebarButton
        text={t('Settings')}
        icon={<IconSettings size={18} />}
        onClick={() => setIsSettingDialog(true)}
      />

      {isAdmin && <SidebarButtonLink
        text={t('Go to Admin')}
        icon={<IconAdjustments size={18} />}
        href="/admin"
      />}

      <SettingDialog
        open={isSettingDialogOpen}
        onClose={() => {
          setIsSettingDialog(false);
        }}
      />
    </div>
  );
};
