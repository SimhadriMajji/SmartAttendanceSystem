import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, firestore } from './Firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import './Upload.css'; // Ensure you have the CSS file imported

const Upload = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [scheduleOptions, setScheduleOptions] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [menuOpen, setMenuOpen] = useState(true); // Menu open by default
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userCollection = collection(firestore, 'users');
        const q = query(userCollection, where('email', '==', currentUser.email));
        getDocs(q)
          .then((querySnapshot) => {
            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              setUserData(userDoc.data());
              fetchSchedule(userDoc.data().name, selectedDate); // Fetch schedule initially
            } else {
              console.warn('User document not found for email:', currentUser.email);
            }
          })
          .catch((err) => {
            console.error('Error fetching user data:', err);
          });
      } else {
        setUser(null);
        setUserData(null);
        navigate('/');
      }
    });

    return unsubscribe;
  }, [navigate, selectedDate]);

  useEffect(() => {
    console.log("Schedule Options Updated:", scheduleOptions);
  }, [scheduleOptions]); // Log scheduleOptions whenever it changes

  const fetchSchedule = async (username, date) => {
    try {
      // Convert to IST (UTC+5:30)
      const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
      const response = await axios.get('http://127.0.0.1:5000/get_schedule', {
        params: {
          username,
          selectedDate: istDate.toISOString().split('T')[0] // Convert to YYYY-MM-DD format
        }
      });
      setScheduleOptions(response.data);
      console.log(response.data); // Update scheduleOptions state with response data
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };
  const handleDownloadReport = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/download_attendance', {
        
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', 'attendance_report.xlsx');
      // document.body.appendChild(link);
      // link.click();
      // link.remove();
    } catch (error) {
      console.error('Error downloading attendance report:', error);
      setMessage('Download failed: ' + error.message); // Set error message
    }
  };
  const handleFileChange = (event) => {
    setSelectedFiles([...selectedFiles, ...event.target.files]);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append('files[]', file);
    }
    formData.append('selectedSchedule', selectedSchedule); // Add selected schedule to formData
    formData.append('selectedDate', selectedDate.toISOString().split('T')[0]); // Add selected date to formData

    try {
      const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log(response.data);
      setMessage(response.data.message); // Set success message
      setSelectedFiles([]); // Clear selected files after successful upload
    } catch (error) {
      setMessage('Upload failed: ' + error.message); // Set error message
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUserData(null);
    navigate('/');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="upload-page">
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

      <div className={`content1 ${menuOpen ? 'shifted' : ''}`}>
        <div className="upload-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <h2>Upload Images</h2>
              <label>Select Date:</label>
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  fetchSchedule(userData.name, date); // Call fetchSchedule on date change
                }}
                dateFormat="yyyy-MM-dd"
              />
            </div>
            <div className="form-group">
              <br></br>
              <label className="schedule-label">Select Schedule:</label>
              <select
                value={selectedSchedule}
                onChange={(e) => setSelectedSchedule(e.target.value)}
                className="smaller" // Added smaller class for smaller select button
              >
                <option value="">Select Schedule</option>
                {scheduleOptions.length === 0 ? (
                  <option value="" disabled>
                    No schedule available for selected date
                  </option>
                ) : (
                  scheduleOptions.map((schedule, index) => (
                    <option
                      key={index}
                      value={`${schedule[0]} ${schedule[1]} ${schedule[2]}`}
                    >
                      {`${schedule[0]}, ${schedule[1]}, ${schedule[2]}`}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="form-group">
              <input type="file" multiple onChange={handleFileChange} />
              <button type="submit" disabled={scheduleOptions.length === 0}>
                Upload
              </button>
            </div>
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={index}>
                  {file.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            {message && <p>{message}</p>}
          </form>
          <button onClick={handleDownloadReport}>Download Attendance Report</button>
        </div>
      </div>
    </div>
  );
};

export default Upload;
