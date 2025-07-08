from flask import Flask, jsonify, request, make_response,send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import date
from ultralytics import YOLO
from deepface import DeepFace
from PIL import Image, ImageFile
import concurrent.futures
import shutil
import cv2
import os
import mysql.connector
import pymysql.cursors
from datetime import datetime
import pandas as pd
app = Flask(__name__)
CORS(app)

# Configure the SQLAlchemy part
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:Simhadri@localhost/Smartattendancesystem'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Define models
class Student(db.Model):
    student_id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100))
    branch = db.Column(db.String(100))
    academic_year = db.Column(db.Integer)

class Attendance(db.Model):
    attendance_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(50), db.ForeignKey('student.student_id'), nullable=False)
    attendance_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum('Present', 'Absent'), nullable=False)

with app.app_context():
    db.create_all()

# Database connection function
def get_db_connection():
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="Simhadri",
        database="Smartattendancesystem"
    )
    return connection

# Define endpoints
@app.route('/create_student', methods=['POST'])
def create_student():
    data = request.get_json()
    new_student = Student(
        student_id=data['student_id'], 
        name=data['name'], 
        email=data['email'], 
        branch=data['branch'], 
        academic_year=data['academic_year']
    )
    db.session.add(new_student)
    db.session.commit()
    return jsonify({'message': 'Student created successfully'})

def mark_attendance(names,branch,course_code,num_periods):
    connection = get_db_connection()
    cursor = connection.cursor()
    attendance_date=selectdate
    # Assuming LectureTimetable table has columns: lecturer_name, course_code, no_of_periods
    query = "SELECT student_id FROM student"
    # query1= "Select num_periods from LectureTimetable where lecturer_name= %s and branch= %s and day_of_week=%s "
    cursor.execute(query)
    students = cursor.fetchall()
    student_names = [student[0] for student in students]
    for name in names:
        if name!="unknown":
            query = """
                INSERT INTO attendance (student_id, attendance_date, status,branch,course_code,num_periods)
                VALUES (%s, %s, %s,%s,%s, %s)
                """
            cursor.execute(query, (name, attendance_date, 'Present',branch,course_code, num_periods))
    absent_students = [student for student in student_names if student not in names]
    for name in absent_students:
        query = """
                INSERT INTO attendance (student_id, attendance_date, status,branch,course_code, num_periods)
                VALUES (%s, %s, %s,%s, %s, %s)
                """
        cursor.execute(query, (name, attendance_date, 'Absent',branch,course_code,num_periods))
    connection.commit()
    cursor.close()
    connection.close()
    return jsonify({'message': 'Attendance marked successfully'})

    


@app.route('/branches', methods=['GET'])
def get_branches():
    connection = get_db_connection()
    cursor = connection.cursor()

    query = "SELECT DISTINCT branch FROM attendance"
    cursor.execute(query)
    branches = [row[0] for row in cursor.fetchall()]

    cursor.close()
    connection.close()

    return jsonify({'branches': branches})
startdate=''
enddate=''
@app.route('/branch-attendance', methods=['GET'])
def get_branch_attendance():
    connection = get_db_connection()
    cursor = connection.cursor()
    global startdate
    global enddate
    branch = request.args.get('branch')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    startdate=start_date
    end_date=end_date
    # Fetch student IDs, roll numbers, and names
    query_students = "SELECT student_id, name FROM student"
    cursor.execute(query_students)
    students = cursor.fetchall()
    student_data = {student[0]: {'student_id': student[0], 'name': student[1]} for student in students}  # Dictionary mapping student_id to roll_number and name

    # Fetch subjects
    query_subjects = "SELECT course_code FROM subjects"
    cursor.execute(query_subjects)
    subjects = cursor.fetchall()
    subject_list = [row[0] for row in subjects]

    attendance_data = {}

    for student_id, student_info in student_data.items():
        student_name = student_info['name']
        student_roll_number = student_info['student_id']
        attendance_data[student_roll_number] = {
            'name': student_name,
            'attendance': {subject: {'total': 0, 'presents': 0} for subject in subject_list}
        }

        for subject in subject_list:
            query_total = """
                    SELECT COUNT(*) FROM attendance 
                    WHERE branch = %s AND course_code = %s AND attendance_date BETWEEN %s AND %s AND student_id = %s
                """
            cursor.execute(query_total, (branch, subject, start_date, end_date, student_id))
            total_count = cursor.fetchone()[0]

            query_presents = """
                    SELECT COUNT(*) FROM attendance 
                    WHERE branch = %s AND course_code = %s AND attendance_date BETWEEN %s AND %s AND status='Present' AND student_id = %s
                """
            cursor.execute(query_presents, (branch, subject, start_date, end_date, student_id))
            present_count = cursor.fetchone()[0]

            attendance_data[student_roll_number]['attendance'][subject] = {
                'total': total_count,
                'presents': present_count
            }

    cursor.close()
    connection.close()

    # Calculate attendance percentage for each student
    for student_id, data in attendance_data.items():
        for subject, attendance in data['attendance'].items():
            total_periods = attendance['total']
            presents = attendance['presents']
            if total_periods > 0:
                attendance['percentage'] = (presents / total_periods) * 100
            else:
                attendance['percentage'] = 0

    return jsonify({
        'attendance': attendance_data,
        'subjects': subject_list
    })



@app.route('/student-attendance', methods=['GET'])
def get_student_attendance():
    connection = get_db_connection()
    cursor = connection.cursor()
    global startdate
    global enddate
    student_id = request.args.get('student_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    startdate=start_date
    enddate=end_date
    # Check if the student_id exists
    query_student_check = "SELECT name FROM student WHERE student_id = %s"
    cursor.execute(query_student_check, (student_id,))
    student_record = cursor.fetchone()

    if not student_record:
        cursor.close()
        connection.close()
        return jsonify({'error': 'Wrong Roll Number'}), 404

    student_name = student_record[0]

    # Fetch subjects
    query_subjects = "SELECT course_code FROM subjects"
    cursor.execute(query_subjects)
    subjects = cursor.fetchall()
    subject_list = [row[0] for row in subjects]

    # Fetch attendance
    query_attendance = """
        SELECT course_code, COUNT(*) as total, 
               SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as presents
        FROM attendance
        WHERE student_id = %s AND attendance_date BETWEEN %s AND %s
        GROUP BY course_code
    """
    cursor.execute(query_attendance, (student_id, start_date, end_date))
    records = cursor.fetchall()

    attendance_data = {subject: {'total': 0, 'presents': 0} for subject in subject_list}  # Initialize all subjects with 0
    for record in records:
        attendance_data[record[0]] = {
            'total': record[1],
            'presents': record[2]
        }

    cursor.execute(query_attendance, (student_id, start_date, end_date))
    records = cursor.fetchall()

    attendance_data = {subject: {'total': 0, 'presents': 0} for subject in subject_list}  # Initialize all subjects with 0
    for record in records:
        attendance_data[record[0]] = {
            'total': record[1],
            'presents': record[2]
        }

    cursor.close()
    connection.close()
    return jsonify({
        'attendance': attendance_data,
        'subjects': subject_list,
        'student_name': student_name
    })


def get_day_of_week(date):
    # Convert date string to datetime object
    date_obj = datetime.strptime(date, '%Y-%m-%d')
    # Get day of the week as an integer (0 = Monday, ..., 6 = Sunday)
    day_of_week = date_obj.weekday()
    # Return day of the week as string (e.g., 'Monday')
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day_of_week]
selectdate=''
@app.route('/get_schedule', methods=['GET'])
def get_schedule():
    username = request.args.get('username')
    global selectdate
    global selected_dated
    selected_date = request.args.get('selectedDate')
    print(selected_date)
    selectdate=selected_date
    # Convert selected_date to day_of_week
    day_of_week = get_day_of_week(selected_date)
    connection = get_db_connection()
    cursor = connection.cursor()

    #Assuming LectureTimetable table has columns: lecturer_name, course_code, no_of_periods
    query = "SELECT branch, course_code, num_periods FROM LectureTimetable WHERE lecturer_name = %s AND day_of_week = %s"
    cursor.execute(query, (username, day_of_week))
    schedule = cursor.fetchall()
    cursor.close()
    connection.close()
    
    return jsonify(schedule)


# Define constants
UPLOAD_FOLDER = 'uploads'
EXTRACTED_FACES_FOLDER = 'faces'
UNKNOWN_FACES_FOLDER = 'unknown'
KNOWN_FACES_FOLDER = 'known'

@app.route('/')
def index():
    return 'Attendance functionality not yet implemented.'
branch=''
course_code=''
num_periods=0
@app.route('/upload', methods=['POST'])
def upload_files():
    # attendance_date = request.args.get('selectedDate')
    if os.path.exists(UPLOAD_FOLDER):
        shutil.rmtree(UPLOAD_FOLDER)
    os.makedirs(UPLOAD_FOLDER)
    global branch
    global course_code
    global num_periods
    files = request.files.getlist('files[]')
    selected_schedule = request.form['selectedSchedule']
    schedule_parts = selected_schedule.split()
    branch = schedule_parts[0]
    course_code = schedule_parts[1]
    num_periods = int(schedule_parts[2])
    for file in files:
        filename = file.filename
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

    attendancesystem(branch,course_code,num_periods)

    # shutil.rmtree(UPLOAD_FOLDER)
    # os.makedirs(UPLOAD_FOLDER)

    return make_response(jsonify({'message': 'Files uploaded successfully.'}), 200)

Image.MAX_IMAGE_PIXELS = None
ImageFile.LOAD_TRUNCATED_IMAGES = True

count = 0

def faceRecognition():
    if os.path.exists(UNKNOWN_FACES_FOLDER):
        shutil.rmtree(UNKNOWN_FACES_FOLDER)
    os.makedirs(UNKNOWN_FACES_FOLDER)

    if os.path.exists(KNOWN_FACES_FOLDER):
        shutil.rmtree(KNOWN_FACES_FOLDER)
    os.makedirs(KNOWN_FACES_FOLDER)
    
    extracted_names = []
    for filename in os.listdir(EXTRACTED_FACES_FOLDER):
        if filename.lower().endswith((".jpg", ".jpeg", ".png")):
            img_path = os.path.join(EXTRACTED_FACES_FOLDER, filename)
            model = DeepFace.find(
                img_path=img_path, 
                db_path="Database1", 
                enforce_detection=False, 
                model_name="Facenet512"
            )

            if model and len(model[0]['identity']) > 0:
                name = model[0]['identity'][0].split('/')[1]
                known_face_path = os.path.join(KNOWN_FACES_FOLDER, f"{len(extracted_names) + 1}_{name}.jpg")
                shutil.copy(img_path, known_face_path)
            else:
                name = 'unknown'
                unknown_face_path = os.path.join(UNKNOWN_FACES_FOLDER, f"{len(extracted_names) + 1}.jpg")
                shutil.copy(img_path, unknown_face_path)
            extracted_names.append(name)
    return extracted_names

def faceExtraction(input_image, model, results):
    global count
    image = Image.open(input_image)
    detected_objects = []
    print(0)
    if hasattr(results, 'boxes') and hasattr(results, 'names'):
        for box in results.boxes.xyxy:
            object_id = int(box[-1])
            object_name = results.names.get(object_id)
            x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
            detected_objects.append((object_name, (x1, y1, x2, y2)))

    for i, (object_name, (x1, y1, x2, y2)) in enumerate(detected_objects):
        face_image = image.crop((x1, y1, x2, y2))
        face_image.save(os.path.join(EXTRACTED_FACES_FOLDER, f"face{count}.jpg"))
        count += 1
    return 0

def faceDetection(input_image):
    model = YOLO('best.pt')
    results = model.predict(input_image)[0]
    faceExtraction(input_image, model, results)

def attendancesystem(branch,course_code,num_periods):
    if os.path.exists(EXTRACTED_FACES_FOLDER):
        shutil.rmtree(EXTRACTED_FACES_FOLDER)
    os.makedirs(EXTRACTED_FACES_FOLDER)

    for filename in os.listdir(UPLOAD_FOLDER):
        if filename.lower().endswith((".jpg", ".jpeg", ".png")):
            image_path = os.path.join(UPLOAD_FOLDER, filename)
            faceDetection(image_path)

    names = faceRecognition()
    global count
    count = 0
    mark_attendance(names,branch,course_code,num_periods)

@app.route('/download_attendance', methods=['GET'])
def download_attendance():
    global selectdate
    print("Download request received for date:", selectdate)  # Debug statement
    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
        SELECT s.student_id, s.name, a.attendance_date, a.status
FROM student s
LEFT JOIN (
    SELECT student_id, attendance_date, status
    FROM attendance
    WHERE branch = %s AND attendance_date = %s
    GROUP BY student_id, attendance_date, status
) a ON s.student_id = a.student_id
ORDER BY s.student_id;
    """
    cursor.execute(query, (branch, selectdate))
    records = cursor.fetchall()

    cursor.close()
    connection.close()

    df = pd.DataFrame(records, columns=['Student ID', 'Name', 'Date', 'Status'])
    home_dir = os.path.expanduser('~')
    downloads_folder = os.path.join(home_dir, 'Downloads')
    file_name = f'attendance_{selectdate}_{branch}.xlsx'
    excel_file_path = os.path.join(downloads_folder, file_name)
   
    df.to_excel(excel_file_path, index=False)

    print("Excel file generated:", file_name)  # Debug statement

    return send_file(excel_file_path, as_attachment=True)

@app.route('/download_attendance1', methods=['GET'])
def download_attendance1():
    global selectdate
    print("Download request received for date:", selectdate)  # Debug statement
    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
        SELECT s.student_id, s.name, a.attendance_date, a.status
FROM student s
LEFT JOIN (
    SELECT student_id, attendance_date, status
    FROM attendance
    WHERE branch = %s AND attendance_date Between  %s AND %s
    GROUP BY student_id, attendance_date, status
) a ON s.student_id = a.student_id
ORDER BY s.student_id;
    """
    cursor.execute(query, (branch, startdate,enddate))
    records = cursor.fetchall()

    cursor.close()
    connection.close()

    df = pd.DataFrame(records, columns=['Student ID', 'Name', 'Date', 'Status'])
    home_dir = os.path.expanduser('~')
    downloads_folder = os.path.join(home_dir, 'Downloads')
    file_name = f'attendance_{selectdate}_{branch}.xlsx'
    excel_file_path = os.path.join(downloads_folder, file_name)
   
    df.to_excel(excel_file_path, index=False)

    print("Excel file generated:", file_name)  # Debug statement

    return send_file(excel_file_path, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)
