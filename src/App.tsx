// import './locale/i18n';
import { Outlet, Route, Routes } from 'react-router-dom';

import Conversation from './conversation/Conversation';

// import Conversation from './conversation/Conversation';
// import { useDarkTheme } from './hooks';

export default function App() {
  //   const [, , componentMounted] = useDarkTheme();

  //   if (!componentMounted) {
  //     return <div />;
  //   }

  return (
    <div className="relative h-full overflow-hidden">
      <Routes>
        <Route path="/" element={<Conversation />} />
      </Routes>
    </div>
  );
}
