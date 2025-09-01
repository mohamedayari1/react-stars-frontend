import { useState } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import DualSSEConversation from './conversation/DualSSEConversation';
import { useMediaQuery } from './hooks';
import MinimalNavigation from './SidebarNavigation';

function MainLayout() {
  const { isMobile, isTablet } = useMediaQuery();
  const [navOpen, setNavOpen] = useState(!(isMobile || isTablet));

  return (
    <div className="dark:bg-raisin-black relative h-screen overflow-hidden">
      <MinimalNavigation navOpen={navOpen} setNavOpen={setNavOpen} />
      <div
        className={`h-[calc(100dvh-64px)] overflow-auto lg:h-screen ${
          !(isMobile || isTablet)
            ? `ml-0 ${!navOpen ? 'lg:mx-auto' : 'lg:ml-72'}`
            : 'ml-0 lg:ml-16'
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="relative h-full overflow-hidden">
      <Routes>
        <Route element={<MainLayout />}>
          {/* <Route index element={<Conversation />} /> */}

          {/* <Route path="/" element={<SSEConversation />} /> */}
          <Route path="/" element={<DualSSEConversation />} />
        </Route>
      </Routes>
    </div>
  );
}
