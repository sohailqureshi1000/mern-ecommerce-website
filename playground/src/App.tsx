import { Disclosure } from "./components/Disclosure";
import { useState } from "react";
import { Modal } from "./components/Modal";
import { Tabs } from "./components/Tabs";
import "./App.css";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="app">
      <h1>Accessible Component Playground</h1>

      <section>
        <h2>Modal</h2>
        <button type="button" onClick={() => setIsModalOpen(true)}>
          Open Modal
        </button>

        {/* A second button just to prove keyboard focus doesn't leak out */}
        <button type="button">
          Another Button (should be unreachable while modal is open)
        </button>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Example Modal"
        >
          <p>Try pressing Tab, Shift+Tab, and Escape.</p>
          <input type="text" placeholder="Focusable input" />
          <button type="button">Another action</button>
        </Modal>
      </section>

      <section>
        <h2>Tabs</h2>
        <Tabs
          tabs={[
            {
              id: "profile",
              label: "Profile",
              content: <p>Profile content goes here.</p>,
            },
            {
              id: "settings",
              label: "Settings",
              content: <p>Settings content goes here.</p>,
            },
            {
              id: "billing",
              label: "Billing",
              content: <p>Billing content goes here.</p>,
            },
          ]}
        />
      </section>

      <section>
        <h2>Disclosure</h2>
        <Disclosure summary="What is an accessible component?">
          <p>
            A component that works correctly with keyboard navigation and screen
            readers, using proper ARIA roles and states.
          </p>
        </Disclosure>
        <Disclosure summary="Why not just use a component library?">
          <p>
            Building it by hand first teaches what correct behavior actually
            looks like, so you can properly review AI-generated or library code
            later.
          </p>
        </Disclosure>
      </section>
    </div>
  );
}

export default App;
