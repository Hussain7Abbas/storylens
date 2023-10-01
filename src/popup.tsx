import React from 'react'
import ReactDOM from 'react-dom/client'
import './assets/styles/index.css'

function Popup() {
  console.log('🍅', 'Hello from src/App.tsx:5:5')
  alert("Hello")

  return (
    <>
      dfds
    </>
  )
}

const root = document.createElement("div")
root.id = "novzella-root"
document.body.appendChild(root)
ReactDOM.createRoot(root!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>,
)
