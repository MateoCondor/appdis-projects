import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

//Estilos base de PrimeReact
import "primereact/resources/primereact.min.css";
                    
// Tema de PrimeReact (elige uno)
import "primereact/resources/themes/lara-light-indigo/theme.css";
               
// Iconos de PrimeReact
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
