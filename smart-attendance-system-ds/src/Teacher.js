import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, firestore } from './Firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import './Teacher.css';

const Teacher = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Initially set to true to keep the sidebar open
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
        navigate('/'); // Redirect to login page if user is not authenticated
      }
    });

    return unsubscribe;
  }, [navigate]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setUser(null);
        setUserData(null);
        navigate('/');
      })
      .catch((error) => {
        console.error('Error signing out:', error);
      });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="teacher-page">
      <button className={`menu-button ${sidebarOpen ? 'active' : ''}`} onClick={toggleSidebar}>
        <i className="fa fa-bars"></i> Menu
      </button>
      <nav className={`navbar ${sidebarOpen ? 'open' : ''}`}>
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

      <div className={`content ${sidebarOpen ? 'shifted' : ''}`}>
        {user ? (
          <div className="profile-content">
            <br />
            {userData ? (
              <div className="user-details">
                <h2>Welcome, {userData.name}</h2>
                <h3>Profile Information:</h3>
                <p>
                  <strong>Name:</strong> {userData.name}
                </p>
                <p>
                  <strong>ID:</strong> {userData.Id}
                </p>
                <p>
                  <strong>Email:</strong> {userData.email}
                </p>
                <p>
                  <strong>Role:</strong> {userData.role}
                </p>
                <p>
                  <strong>Phone:</strong> {userData.Phone}
                </p>
                <p>
                  <strong>Department:</strong> {userData.Department}
                </p>
              </div>
            ) : (
              <p>Loading user data...</p>
            )}
          </div>
        ) : (
          <p>No user data found.</p>
        )}
      </div>
    </div>
  );
};

export default Teacher;
