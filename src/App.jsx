// App.jsx
import { useState } from 'react';
import './App.css';
import Home from './modules/home';
import Account from './modules/account';
import Aviator from './modules/aviator';
import Aviator2 from './modules/aviator/index2';
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/account" element={<Account />} />
        <Route path="/aviator" element={<Aviator />} />
        <Route path="/aviator/play" element={<Aviator2 />} />
      </Routes>
    </div>
  );
}

export default App;
