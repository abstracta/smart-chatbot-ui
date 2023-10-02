import { useContext, useState } from 'react';
import AdminContext from '@/pages/admin/admin.context';
import SidebarBase from '../Sidebar/Sidebar';
import { IconArrowBackUp, IconSettings, IconUsers } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { SidebarButton } from '../Sidebar/SidebarButton';
import AdminSettingDialog from './AdminSettingDialog';
import { useTranslation } from 'react-i18next';
import { SidebarButtonLink } from '../Sidebar/SidebarButtonLink';


export const AdminSideNav = () => {
  const {
    state: { showNavBar },
    dispatch: adminDispatch,
  } = useContext(AdminContext);
  const router = useRouter();

  const { t } = useTranslation('sidebar');
  const [isSettingDialogOpen, setIsSettingDialog] = useState<boolean>(false);

  const handleToggleNavBar = () => {
    localStorage.setItem('showNavBar', JSON.stringify(!showNavBar));
    adminDispatch({ field: 'showNavBar', value: !showNavBar });
  };

  return (
    <SidebarBase
      isOpen={showNavBar}
      side="left"
      toggleOpen={handleToggleNavBar}
    >
      <div className="flex flex-col flex-grow overflow-auto">
        <a className="text-lg p-4 mb-4">{t('Admin dashboard')}</a>
        <Link className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-sm transition-colors duration-200 hover:bg-[#343541]/90
            ${router.pathname == "/admin" || router.pathname == "/admin/users" ? "bg-[#343541]/90" : ""}`}
          href="/admin/users"
        >
          <IconUsers size={18} />
          <div className="relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap break-all text-left text-[12.5px] leading-3">
            {t('Users')}
          </div>
        </Link>
      </div>
      <div className="flex flex-col items-center space-y-1 border-t border-white/20 pt-1 text-sm">
        <SidebarButton
          text={t('Settings')}
          icon={<IconSettings size={18} />}
          onClick={() => setIsSettingDialog(true)}
        />

        <SidebarButtonLink
          text={t('Go to Chat')}
          icon={<IconArrowBackUp size={18} />}
          href="/"
        />

        <AdminSettingDialog
          open={isSettingDialogOpen}
          onClose={() => {
            setIsSettingDialog(false);
          }}
        />
      </div>
    </SidebarBase>
  );
};
