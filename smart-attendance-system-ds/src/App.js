import FacultySchedule from './FacultySchedule';
import { Routes, Route } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
      <Routes>
        <Route path="/" element={<FacultySchedule />} />
      </Routes>
  );
}

export default App;