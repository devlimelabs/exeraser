import os
import base64
import uuid
import requests
from io import BytesIO
from flask import Blueprint, request, jsonify, current_app, send_from_directory
import time

image_bp = Blueprint('image', __name__)

# Mock person detection data for testing
MOCK_PEOPLE_DATA = [
    {"id": 1, "x": 25, "y": 30, "width": 20, "height": 40, "confidence": 0.95},
    {"id": 2, "x": 55, "y": 25, "width": 18, "height": 45, "confidence": 0.88},
    {"id": 3, "x": 75, "y": 35, "width": 15, "height": 35, "confidence": 0.92}
]

@image_bp.route('/upload', methods=['POST'])
def upload_image():
    """Handle image upload and return image info"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            return jsonify({'error': 'File must be an image'}), 400
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        
        # Read image data
        image_data = file.read()
        
        # Save image temporarily (in production, use cloud storage)
        upload_dir = os.path.join(current_app.root_path, 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Determine file extension
        content_type = file.content_type
        if 'jpeg' in content_type or 'jpg' in content_type:
            ext = 'jpg'
        elif 'png' in content_type:
            ext = 'png'
        else:
            ext = 'jpg'  # default
        
        image_path = os.path.join(upload_dir, f"{file_id}.{ext}")
        with open(image_path, 'wb') as f:
            f.write(image_data)
        
        # Convert to base64 for frontend
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        return jsonify({
            'success': True,
            'file_id': file_id,
            'image_data': f"data:{content_type};base64,{image_base64}",
            'width': 800,  # Mock dimensions
            'height': 600,
            'message': 'Image uploaded successfully'
        })
        
    except Exception as e:
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

@image_bp.route('/detect-people', methods=['POST'])
def detect_people():
    """Detect people in the uploaded image using AI"""
    try:
        data = request.get_json()
        file_id = data.get('file_id')
        
        if not file_id:
            return jsonify({'error': 'No file_id provided'}), 400
        
        # Simulate processing time
        time.sleep(2)
        
        # Return mock detection data
        detected_people = MOCK_PEOPLE_DATA.copy()
        
        return jsonify({
            'success': True,
            'people': detected_people,
            'count': len(detected_people),
            'message': f'Detected {len(detected_people)} people in the image'
        })
        
    except Exception as e:
        return jsonify({'error': f'Detection failed: {str(e)}'}), 500

@image_bp.route('/remove-people', methods=['POST'])
def remove_people():
    """Remove selected people from the image using AI"""
    try:
        data = request.get_json()
        file_id = data.get('file_id')
        selected_people = data.get('selected_people', [])
        people_data = data.get('people_data', [])
        quality_mode = data.get('quality_mode', 'fast')
        
        if not file_id:
            return jsonify({'error': 'No file_id provided'}), 400
        
        if not selected_people:
            return jsonify({'error': 'No people selected for removal'}), 400
        
        # Find original image
        upload_dir = os.path.join(current_app.root_path, 'uploads')
        
        # Try different extensions
        image_path = None
        for ext in ['jpg', 'png', 'jpeg']:
            potential_path = os.path.join(upload_dir, f"{file_id}.{ext}")
            if os.path.exists(potential_path):
                image_path = potential_path
                break
        
        if not image_path:
            return jsonify({'error': 'Original image not found'}), 404
        
        # Simulate processing time
        processing_time = 3 if quality_mode == 'fast' else 6
        time.sleep(processing_time)
        
        # For demo purposes, return the same image
        with open(image_path, 'rb') as f:
            image_data = f.read()
            image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Generate result filename
        result_id = str(uuid.uuid4())
        result_path = os.path.join(upload_dir, f"{result_id}_result.jpg")
        
        # Save result (copy of original for demo)
        with open(result_path, 'wb') as f:
            f.write(image_data)
        
        # Determine content type
        content_type = 'image/jpeg'
        if image_path.endswith('.png'):
            content_type = 'image/png'
        
        return jsonify({
            'success': True,
            'result_id': result_id,
            'result_image': f"data:{content_type};base64,{image_base64}",
            'removed_people': selected_people,
            'message': f'Successfully removed {len(selected_people)} people from the image'
        })
        
    except Exception as e:
        return jsonify({'error': f'Processing failed: {str(e)}'}), 500

@image_bp.route('/download/<result_id>', methods=['GET'])
def download_result(result_id):
    """Download the processed image"""
    try:
        upload_dir = os.path.join(current_app.root_path, 'uploads')
        result_path = os.path.join(upload_dir, f"{result_id}_result.jpg")
        
        if not os.path.exists(result_path):
            return jsonify({'error': 'Result image not found'}), 404
        
        return send_from_directory(upload_dir, f"{result_id}_result.jpg", as_attachment=True)
        
    except Exception as e:
        return jsonify({'error': f'Download failed: {str(e)}'}), 500

@image_bp.route('/status', methods=['GET'])
def api_status():
    """API health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'Exerase Image Processing API',
        'version': '1.0.0',
        'mode': 'demo',
        'ai_services': {
            'person_detection': 'Mock Detection (Demo Mode)',
            'image_processing': 'Mock Processing (Demo Mode)',
            'note': 'Using demo data for deployment compatibility'
        },
        'endpoints': {
            'upload': '/api/image/upload',
            'detect': '/api/image/detect-people',
            'remove': '/api/image/remove-people',
            'download': '/api/image/download/<result_id>'
        }
    })

