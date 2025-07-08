import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import Login from './Login';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Student from './Student';
import App from './App';
import Teacher from './Teacher';
import Upload from './Upload';
import BranchAttendance from './BranchAttendance';
import StudentAttendance from './StudentAttendance';
import StudentViewAttendance from './StudentViewAttendance';
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login/>}/>
      <Route path="/Student" element={<Student/>}/>
      <Route path="/Teacher" element={<Teacher/>}/>
      <Route path="/BranchAttendance" element={<BranchAttendance/>}/>
      <Route path="/StudentAttendance" element={<StudentAttendance/>}/>
      <Route path="/upload-attendance" element={<Upload />} />
      <Route path="/view-attendance" element={<StudentViewAttendance />} />
    </Routes>
  </BrowserRouter>
);


reportWebVitals();