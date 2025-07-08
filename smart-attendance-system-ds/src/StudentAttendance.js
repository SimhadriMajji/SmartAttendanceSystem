import React, { useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './StudentAttendance.css'; // Import the CSS file for styling
import { useNavigate, Link } from 'react-router-dom';

const StudentAttendance = () => {
    const [studentId, setStudentId] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [message, setMessage] = useState('');
    const [endDate, setEndDate] = useState(new Date());
    const [studentAttendance, setStudentAttendance] = useState({});
    const [subjects, setSubjects] = useState([]);
    const [error, setError] = useState('');
    const [studentInfo, setStudentInfo] = useState({ name: '', rollno: '' });
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [menuOpen, setMenuOpen] = useState(true); // Menu open by default
    const navigate = useNavigate();

    const handleDownloadReport = async () => {
        try {
          const response = await axios.get('http://127.0.0.1:5000/download_attendance1', {
            
            responseType: 'blob',
          });
    
        //   const url = window.URL.createObjectURL(new Blob([response.data]));
        //   const link = document.createElement('a');
        //   link.href = url;
        // //   link.setAttribute('download', 'attendance_report.xlsx');
        //   //document.body.appendChild(link);
        //   link.click();
        //   link.remove();
        } catch (error) {
          console.error('Error downloading attendance report:', error);
          setMessage('Download failed: ' + error.message); // Set error message
        }
      };
    const fetchStudentAttendance = async () => {
        try {
            // Convert start and end dates to IST (UTC+5:30)
            const istStartDate = new Date(startDate.getTime() + 5.5 * 60 * 60 * 1000);
            const istEndDate = new Date(endDate.getTime() + 5.5 * 60 * 60 * 1000);

            const response = await axios.get('http://127.0.0.1:5000/student-attendance', {
                params: {
                    student_id: studentId,
                    start_date: istStartDate.toISOString().split('T')[0],
                    end_date: istEndDate.toISOString().split('T')[0]
                }
            });
            setStudentAttendance(response.data.attendance);
            setSubjects(response.data.subjects);
            setStudentInfo({
                name: response.data.student_name,
                rollno: studentId
            });
            setError(''); // Clear any previous error
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setError('Wrong Roll Number');
                setStudentAttendance({});
                setSubjects([]);
                setStudentInfo({ name: '', rollno: '' });
            } else {
                console.error('Error fetching student attendance:', error);
                setError('An error occurred while fetching data.');
            }
        }
    };

    const handleLogout = () => {
        setUser(null);
        setUserData(null);
        navigate('/');
    };

    const handleSearch = () => {
        fetchStudentAttendance();
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen); // Toggle the menuOpen state
    };

    return (
        <div className="student-attendance-page">
            <button className={`menu-button ${menuOpen ? 'active' : ''}`} onClick={toggleMenu}>
                <i className="fa fa-bars"></i> Menu
            </button>
            <nav className={`navbar ${menuOpen ? 'open' : ''}`}>
                <ul>
                    <li>
                        <Link to="/Teacher">Profile</Link>
                    </li>
                    <li>
                        <Link to="/upload-attendance">Upload Image</Link>
                    </li>
                    <li>
                        <Link to="/BranchAttendance">Branch Attendance</Link>
                    </li>
                    <li>
                        <Link to="/StudentAttendance">Student Attendance</Link>
                    </li>
                    <li className="bn">
                        <button onClick={handleLogout}>Logout</button>
                    </li>
                </ul>
            </nav>

            <div className={`content2 ${menuOpen ? 'active' : ''}`}>
                <h2>Student Attendance</h2>
                <div className="search-container1">
                    <div className="input-group2">
                        <label>Student ID:</label>
                        <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
                    </div>
                    <div className="date-picker-container1">
                        <div className="input-group1">
                            <label>Start Date:</label>
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                dateFormat="yyyy-MM-dd"
                                className="custom-date-picker1"
                            />
                        </div>
                        <div className="input-group1">
                            <label>End Date:</label>
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                dateFormat="yyyy-MM-dd"
                                className="custom-date-picker1"
                            />
                        </div>
                    </div>
                </div>
                <button className="search-button1" onClick={handleSearch}>Search</button>
                {error && <div style={{ color: 'red' }}>{error}</div>}
                {Object.keys(studentAttendance).length > 0 && (
                    <div>
                        {/* <button onClick={handleDownloadReport}>Download Attendance Report</button> */}
                        <br></br>
                        <h3>Student Information</h3>
                        <p><strong>Name:</strong> {studentInfo.name}</p>
                        <p><strong>Roll Number:</strong> {studentInfo.rollno}</p>
                        <h3>Attendance List</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Total Periods</th>
                                    <th>Presents</th>
                                    <th>Attendance (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.map((subject, index) => (
                                    <tr key={index}>
                                        <td>{subject}</td>
                                        <td>{studentAttendance[subject]?.total || 0}</td>
                                        <td>{studentAttendance[subject]?.presents || 0}</td>
                                        <td>
                                            {studentAttendance[subject]?.total
                                                ? ((studentAttendance[subject].presents / studentAttendance[subject].total) * 100).toFixed(2)
                                                : 0}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentAttendance;
