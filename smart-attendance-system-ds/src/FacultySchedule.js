import React, { useState, useEffect } from 'react';

function FacultySchedule() {
  const [date, setDate] = useState(new Date());
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [classes, setClasses] = useState([]); // Placeholder for class data

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Replace with your backend API call to fetch class data
    // try {
    //   const response = await fetch(/* Your API endpoint */, {
    //     method: 'POST',
    //     body: JSON.stringify({ date, branch, year }),
    //   });
    //   const classData = await response.json();
    //   setClasses(classData);
    // } catch (error) {
    //   console.error('Error fetching class data:', error);
    // }
  };

  return (
    <div>
      <h2>Faculty Schedule</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Date:
          <input type="date" value={date.toISOString().substring(0, 10)} onChange={(e) => setDate(new Date(e.target.value))} />
        </label>
        <label>
          Branch:
          <input type="text" value={branch} onChange={(e) => setBranch(e.target.value)} />
        </label>
        <label>
          Year:
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
        </label>
        <button type="submit">Get Schedule</button>
      </form>
      {classes.length > 0 && (
        <div>
          <h3>Classes</h3>
          <table>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Subject</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.courseCode}>
                  <td>{c.courseCode}</td>
                  <td>{c.subject}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FacultySchedule;