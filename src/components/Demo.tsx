import React, { useState } from "react";
import { ConversationBubble } from "./ConversationBubble";

const Demo = () => {
  const [messages] = useState([
    {
      type: "QUESTION",
      message: "Can you explain React hooks with some code examples?"
    },
    {
      type: "ANSWER",
      message: `# React Hooks

React hooks are functions that let you use state and other React features in functional components.

## Example: useState

\`\`\`javascript
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  );
}
\`\`\`

- Simpler code
- Reusable logic
- No need for class components`
    },
    {
      type: "QUESTION",
      message: "What about useEffect? When should I use it?"
    },
    {
      type: "ANSWER",
      message: `## useEffect

The \`useEffect\` hook lets you perform side effects in function components, like fetching data or subscribing to events.

### Example: Logging on every render
\`\`\`javascript
useEffect(() => {
  console.log("Component rendered!");
});
\`\`\`

### Example: Running only once (like componentDidMount)
\`\`\`javascript
useEffect(() => {
  console.log("Runs only once after mount");
}, []);
\`\`\`

👉 Use it whenever you need to **synchronize your component with external systems** (APIs, events, timers, etc.).`
    },
    {
      type: "QUESTION",
      message: "So basically useState is for state, and useEffect is for side effects?"
    },
    {
      type: "ANSWER",
      message: `✅ Exactly!  

- \`useState\` → manages component state.  
- \`useEffect\` → runs side effects (anything outside React's pure rendering, like fetching data or timers).  

Together, they replace a big part of what class components did.`
    }
  ]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold text-center mb-6">Conversation Demo</h1>
      {messages.map((msg, index) => (
        <ConversationBubble
          key={index}
          type={msg.type}
          message={msg.message}
          className="w-full mb-4"
        />
      ))}
    </div>
  );
};

export default Demo;
