
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './BranchAttendance.css'; // Import the CSS file for styling
import { useNavigate } from 'react-router-dom';

const BranchAttendance = () => {
    const [branches, setBranches] = useState([]);
    const [message, setMessage] = useState('');
const [selectedBranch, setSelectedBranch] = useState('');
const [startDate, setStartDate] = useState(new Date());
const [endDate, setEndDate] = useState(new Date());
const [branchAttendance, setBranchAttendance] = useState({});
const [subjects, setSubjects] = useState([]);
const [error, setError] = useState('');
const [user, setUser] = useState(null);
const [userData, setUserData] = useState(null);
const [menuOpen, setMenuOpen] = useState(true); // Menu open by default
const navigate = useNavigate();

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:5000/branches');
            setBranches(response.data.branches);
        } catch (error) {
            console.error('Error fetching branches:', error);
        }
    };

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
    const fetchBranchAttendance = async () => {
        try {
            // Convert start and end dates to IST (UTC+5:30)
            const istStartDate = new Date(startDate.getTime() + 5.5 * 60 * 60 * 1000);
            const istEndDate = new Date(endDate.getTime() + 5.5 * 60 * 60 * 1000);

            const response = await axios.get('http://127.0.0.1:5000/branch-attendance', {
                params: {
                    branch: selectedBranch,
                    start_date: istStartDate.toISOString().split('T')[0],
                    end_date: istEndDate.toISOString().split('T')[0]
                }
            });
            setBranchAttendance(response.data.attendance);
            setSubjects(response.data.subjects);
            setError(''); // Clear any previous error
        } catch (error) {
            if (error.response && error.response.status === 404) {
                setError('Invalid branch');
                setBranchAttendance({});
                setSubjects([]);
            } else {
                console.error('Error fetching branch attendance:', error);
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
        fetchBranchAttendance();
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <div className="branch-attendance-page">
            <button className={`menu-button ${menuOpen ? 'active' : ''}`} onClick={toggleMenu}>
                <i className="fa fa-bars"></i> Menu
            </button>
            <nav className={`navbar ${menuOpen ? 'open' : ''}`}>
                <ul>
                    <li>
                        <a href="/Teacher">Profile</a>
                    </li>
                    <li>
                        <a href="/upload-attendance">Upload Image</a>
                    </li>
                    <li>
                        <a href="/BranchAttendance">Branch Attendance</a>
                    </li>
                    <li>
                        <a href="/StudentAttendance">Student Attendance</a>
                    </li>
                    <li className="bn">
                        <button onClick={handleLogout}>Logout</button>
                    </li>
                </ul>
            </nav>

            <div className="content2">
                <h2>Branch Attendance</h2>
                <div className="search-container">
                    <div className="input-group">
                        <label>Select Branch:</label>
                        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                            <option value="">-- Select Branch --</option>
                            {branches.map((branch, index) => (
                                <option key={index} value={branch}>
                                    {branch}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="date-picker-container">
                        <div className="input-group">
                            <label>Start Date:</label>
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                dateFormat="yyyy-MM-dd"
                                className="custom-date-picker"
                            />
                        </div>
                        <div className="input-group">
                            <label>End Date:</label>
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                dateFormat="yyyy-MM-dd"
                                className="custom-date-picker"
                            />
                        </div>
                    </div>
                    <button className="search-button" onClick={handleSearch}>Search</button>
                </div>
                {error && <div className="error-message">{error}</div>}
                {Object.keys(branchAttendance).length > 0 && (
                    <div className="attendance-table-container">
                         {/* <button onClick={handleDownloadReport}>Download Attendance Report</button> */}
                         <br></br>
                        <h3>Attendance List for Branch: {selectedBranch}</h3>
                        <div className="attendance-table-wrapper">
                            <table className="attendance-table">
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Roll Number</th>
                                        {subjects.map((subject, index) => (
                                            <th key={index}>{subject}</th>
                                        ))}
                                        <th>Attendance Percentage (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.keys(branchAttendance).map((rollNumber, idx) => (
                                        <tr key={idx}>
                                            <td>{branchAttendance[rollNumber].name}</td>
                                            <td>{rollNumber}</td>
                                            {subjects.map((subject, sIdx) => (
                                                <td key={sIdx}>
                                                    {branchAttendance[rollNumber].attendance[subject]
                                                        ? branchAttendance[rollNumber].attendance[subject].presents || 0
                                                        : 0}
                                                </td>
                                            ))}
                                            <td>
                                                {subjects.reduce((totalPercentage, subject) => {
                                                    const attendance = branchAttendance[rollNumber].attendance[subject];
                                                    if (attendance && attendance.total > 0) {
                                                        const percentage = (attendance.presents / attendance.total) * 100;
                                                        return totalPercentage + percentage;
                                                    }
                                                    return totalPercentage;
                                                }, 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BranchAttendance;
