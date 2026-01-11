import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App.jsx'
import { useTheme } from './context/ThemeContext'

const ThemeStatus = () => {
  const { isDarkMode } = useTheme();
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      background: isDarkMode ? '#ff00ff' : '#ff00ff',
      color: 'white',
      zIndex: 9999,
      padding: '4px 8px',
      fontSize: '12px',
      fontWeight: 'bold'
    }}>
      v1.0.7 - {isDarkMode ? 'DARK' : 'LIGHT'} - RELOADED
    </div>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ThemeStatus />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
