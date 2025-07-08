import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './StudentAttendance.css';
import { useNavigate, Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firestore } from './Firebase'; // Adjust this import path as per your Firebase configuration
import { collection, getDocs, query, where } from 'firebase/firestore';

const StudentViewAttendance = () => {
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [studentAttendance, setStudentAttendance] = useState({});
    const [subjects, setSubjects] = useState([]);
    const [error, setError] = useState('');
    const [studentInfo, setStudentInfo] = useState({ name: '', rollno: '' });
    const [menuOpen, setMenuOpen] = useState(true); // Menu open by default
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const userCollection = collection(firestore, 'users');
                    const q = query(userCollection, where('email', '==', currentUser.email));
                    const querySnapshot = await getDocs(q);
    
                    if (!querySnapshot.empty) {
                        const userDoc = querySnapshot.docs[0];
                        const userData = userDoc.data();
                        setStudentInfo({ name: userData.name, rollno: userData.rollno });
                        console.log("Student Info:", userData); // Log user data for verification
                    } else {
                        console.warn('User document not found for email:', currentUser.email);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            } else {
                console.warn('No user currently signed in.');
                navigate('/'); // Redirect to login page if user is not authenticated
            }
        });
    
        return unsubscribe;
    }, [navigate]);

    const fetchStudentAttendance = async () => {
        try {
            // Convert start and end dates to IST (UTC+5:30)
            const istStartDate = new Date(startDate.getTime() + 5.5 * 60 * 60 * 1000);
            const istEndDate = new Date(endDate.getTime() + 5.5 * 60 * 60 * 1000);

            const response = await axios.get('http://127.0.0.1:5000/student-attendance', {
                params: {
                    student_id: studentInfo.rollno,
                    start_date: istStartDate.toISOString().split('T')[0],
                    end_date: istEndDate.toISOString().split('T')[0]
                }
            });

            setStudentAttendance(response.data.attendance);
            setSubjects(response.data.subjects);
            setError(''); // Clear any previous error
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setError('No attendance data found');
                setStudentAttendance({});
                setSubjects([]);
            } else {
                console.error('Error fetching student attendance:', error);
                setError('An error occurred while fetching data.');
            }
        }
    };

    const handleSearch = () => {
        fetchStudentAttendance();
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen); // Toggle the menuOpen state
    };

    const handleLogout = () => {
        auth.signOut(); // Sign out the user
        navigate('/');
    };

    return (
        <div className="student-attendance-page">
            <button className={`menu-button ${menuOpen ? 'active' : ''}`} onClick={toggleMenu}>
                <i className="fa fa-bars"></i> Menu
            </button>
            <nav className={`navbar ${menuOpen ? 'open' : ''}`}>
                <ul>
                    <li>
                        <Link to="/Student">Profile</Link>
                    </li>
                    <li>
                        <Link to="/view-attendance">Student Attendance</Link>
                    </li>
                    <li className="bn">
                        <button onClick={handleLogout}>Logout</button>
                    </li>
                </ul>
            </nav>

            <div className={`content2 ${menuOpen ? 'shifted' : ''}`}>
                <h2>Student Attendance</h2>
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
                    <button className="search-button1" onClick={handleSearch}>Search</button>
                {error && <div style={{ color: 'red' }}>{error}</div>}
                {Object.keys(studentAttendance).length > 0 && (
                    <div>
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

export default StudentViewAttendance;
