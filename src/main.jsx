import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import TvMode from './tv/TvMode.jsx';
import './index.css';

// ?tv in the address shows the full-screen office TV version.
const isTv = new URLSearchParams(window.location.search).has('tv');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isTv ? <TvMode /> : <App />}
  </React.StrictMode>,
);
