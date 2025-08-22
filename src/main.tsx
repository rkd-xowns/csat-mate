import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { WhiteNoiseProvider } from './contexts/WhiteNoiseContext';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <WhiteNoiseProvider>
          <App />
        </WhiteNoiseProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
