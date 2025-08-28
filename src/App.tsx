// import { Outlet, Route, Routes } from 'react-router-dom';

// import Conversation from './conversation/Conversation';

// export default function App() {

//   return (
//     <div className="relative h-full overflow-hidden">
//       <Routes>
//         <Route path="/" element={<Conversation />} />
//       </Routes>
//     </div>
//   );
// }


import { Outlet, Route, Routes } from 'react-router-dom';

import SSEConversation from './conversation/SSEConversation';

export default function App() {
  return (
    <div className="relative h-full overflow-hidden">
      <Routes>
        <Route path="/" element={<SSEConversation />} />
      </Routes>
    </div>
  );
}