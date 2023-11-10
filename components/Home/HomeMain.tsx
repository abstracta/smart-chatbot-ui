import { useContext } from 'react';

import useConversations from '@/hooks/useConversations';
import HomeContext from '@/pages/api/home/home.context';
import { Chat } from '../Chat/Chat';
import { Chatbar } from '../Chatbar/Chatbar';
import { Navbar } from '../Mobile/Navbar';
import Promptbar from '../Promptbar';
import Spinner from '../Spinner';

type HomeMainProps = {
};

export const HomeMain = ({ }: HomeMainProps) => {
  const {
    state: { settings, selectedConversation },
  } = useContext(HomeContext);

  const [_, conversationsAction] = useConversations();
  return (
    <main
      className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white ${settings.theme}`}
    >
      <div className="fixed top-0 w-full sm:hidden">
        {selectedConversation && <Navbar
          selectedConversation={selectedConversation}
          onNewConversation={() => conversationsAction.add()}
        />}
      </div>

      <div className="flex h-full w-full pt-[48px] sm:pt-0">
        <Chatbar />

        <div className="flex flex-1 relative">
          {!selectedConversation && (<div className="absolute z-30 w-full h-full flex flex-1 self-stretch 
            items-center justify-center bg-white dark:bg-[#343541]" >
            <Spinner size="25px" className="m-auto" />
          </div>)}
          <Chat />
        </div>

        <Promptbar />
      </div>
    </main>
  );
};
