import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, firestore } from './Firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import './Student.css';

const Student = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Set sidebarOpen to true by default
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
    signOut(auth).then(() => {
      setUser(null);
      setUserData(null);
      navigate('/');
    }).catch((error) => {
      console.error('Error signing out:', error);
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="student-page">
      <button className={`menu-button ${sidebarOpen ? 'active' : ''}`} onClick={toggleSidebar}>
        <i className="fa fa-bars"></i> Menu
      </button>
      <nav className={`navbar ${sidebarOpen ? 'open' : ''}`}>
        <ul>
          <li>
            <Link to="/Student">Profile</Link>
          </li>
          <li>
            <Link to="/view-attendance">View Attendance</Link>
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
                <p><strong>Name:</strong> {userData.name}</p>
                <p><strong>Roll no:</strong> {userData.rollno}</p>
                <p><strong>Email:</strong> {userData.email}</p>
                <p><strong>Role:</strong> {userData.role}</p>
                <p><strong>Phone:</strong> {userData.Phone}</p>
                <p><strong>Branch:</strong> {userData.Branch}</p>
                <p><strong>Department:</strong> {userData.Department}</p>
                <p><strong>Academic year:</strong> {userData.Academicyear}</p>
                <p><strong>Semester:</strong> {userData.Semester}</p>
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

export default Student;
