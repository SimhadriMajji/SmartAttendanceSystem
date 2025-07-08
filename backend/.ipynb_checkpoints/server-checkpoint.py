from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/upload')
def get_data():
    # Replace this with your logic to fetch or generate data
    data = {
        "message": "Hello from Flask!",
        "data": [1, 2, 3, 4, 5]
    }
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)  # Ensure the Flask app is running on port 5000
