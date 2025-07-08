from ultralytics import YOLO
from ultralytics.engine.results import Results  
from deepface import DeepFace
from PIL import Image,ImageFile
import concurrent.futures
import shutil
import pandas
import cv2
import os

Image.MAX_IMAGE_PIXELS = None
ImageFile.LOAD_TRUNCATED_IMAGES = True

count = 0

def faceRecognition():
    extractedImages_dir = "faces/"
    unknownFaces_dir = "unknown/"
    knownFaces_dir = "known/"
    
    extracted_names = []
    if os.path.exists(unknownFaces_dir):
        shutil.rmtree(unknownFaces_dir)
    os.makedirs(unknownFaces_dir)
    if os.path.exists(knownFaces_dir):
        shutil.rmtree(knownFaces_dir)
    os.makedirs(knownFaces_dir)

    def process_image(filename):
        if filename.endswith(".jpg") or filename.endswith(".jpeg")  or filename.endswith(".png"):
            img_path = os.path.join(extractedImages_dir, filename)
            model = DeepFace.find(img_path=img_path, db_path="Database1", enforce_detection=False, model_name="Facenet512")

            if model and len(model[0]['identity']) > 0:
                name = model[0]['identity'][0].split('/')[1]
                knownFaces_path = os.path.join(knownFaces_dir, f"{len(extracted_names) + 1}_{name}.jpg")
                shutil.copy(img_path, knownFaces_path)
            else:
                name = 'unknown'
                unknown_faces_path = os.path.join(unknownFaces_dir, f"{len(extracted_names) + 1}.jpg")
                shutil.copy(img_path, unknown_faces_path)
                
            extracted_names.append(name)

    with concurrent.futures.ThreadPoolExecutor() as executor:
        executor.map(process_image, os.listdir(extractedImages_dir))

    return extracted_names

def faceExtraction(input_image, model, results):
    global count
    image = Image.open(input_image)
    detected_objects = []
    if hasattr(results, 'boxes') and hasattr(results, 'names'):
        for box in results.boxes.xyxy:
            object_id = int(box[-1])
            object_name = results.names.get(object_id)
            x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])

            detected_objects.append((object_name, (x1, y1, x2, y2)))

    for i, (object_name, (x1, y1, x2, y2)) in enumerate(detected_objects):
        object_image = image.crop((x1, y1, x2, y2))
        object_image.save(f"faces/face{count}.jpg")
        count += 1

    return 0

def faceDetection(input_image):
    model = YOLO('MINIPROJECT-SmartAttendaceSystem/best.pt')
    results = model.predict(input_image)[0]
    return faceExtraction(input_image, model, results)

def attendancesystem():
    folder_path = 'uploads'
    names = []
    faces_dir = 'faces'

    if os.path.exists(faces_dir):
        shutil.rmtree(faces_dir)
    os.makedirs(faces_dir)
    def process_file(filename):
        for filename in os.listdir(folder_path):
            if filename.endswith(".jpg") or filename.endswith(".jpeg") or filename.endswith(".png"):
                image_path = os.path.join(folder_path, filename)
                print(image_path)
                faceDetection(image_path)

    with concurrent.futures.ThreadPoolExecutor() as executor:
        executor.map(process_file, os.listdir(folder_path))
    global count
    names = faceRecognition()
    print(names)
