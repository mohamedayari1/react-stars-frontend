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

import { Route, Routes } from 'react-router-dom';
import DualSSEConversation from './conversation/DualSSEConversation';

export default function App() {
  return (
    <div className="relative h-full overflow-hidden">
      <Routes>
        {/* <Route path="/" element={<SSEConversation />} /> */}
        <Route path="/" element={<DualSSEConversation />} />
      </Routes>
    </div>
  );
}
