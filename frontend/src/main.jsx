import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// Prevent mouse wheel scrolling from changing values on focused number inputs
document.addEventListener('wheel', () => {
  if (document.activeElement && document.activeElement.type === 'number') {
    document.activeElement.blur();
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
    // <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    // </React.StrictMode>,
)
