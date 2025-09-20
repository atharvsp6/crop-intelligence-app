from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "Crop Intelligence API is running!"

if __name__ == '__main__':
    app.run(debug=True, port=os.environ.get('PORT', 5000))
