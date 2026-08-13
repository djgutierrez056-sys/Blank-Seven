import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './Home'
import Room from './Room'
import './App.css'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </HashRouter>
  )
}
