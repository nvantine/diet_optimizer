import { useState } from 'react'
import './App.css'
import DietOptimizer from './components/DietOptimizer'

function App() {
  const [count, setCount] = useState(0)

  return (
      <DietOptimizer/>
  )
}

export default App
