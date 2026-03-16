/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateBoard from './pages/CreateBoard';
import StartSession from './pages/StartSession';
import JoinSession from './pages/JoinSession';
import Game from './pages/Game';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateBoard />} />
          <Route path="/start" element={<StartSession />} />
          <Route path="/join" element={<JoinSession />} />
          <Route path="/game/:roomId" element={<Game />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
