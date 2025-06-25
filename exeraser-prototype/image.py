import os
import base64
import uuid
import requests
from io import BytesIO
from PIL import Image
from flask import Blueprint, request, jsonify, current_app, send_from_directory
import time
from src.services.ai_services import create_ai_services

image_bp = Blueprint('image', __name__)

# Initialize AI services
ai_services = create_ai_services()

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
        
        # Read and validate image
        try:
            image = Image.open(file.stream)
            width, height = image.size
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Save image temporarily (in production, use cloud storage)
            upload_dir = os.path.join(current_app.root_path, 'uploads')
            os.makedirs(upload_dir, exist_ok=True)
            
            image_path = os.path.join(upload_dir, f"{file_id}.jpg")
            image.save(image_path, 'JPEG', quality=95)
            
            # Convert to base64 for frontend
            buffer = BytesIO()
            image.save(buffer, format='JPEG', quality=95)
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return jsonify({
                'success': True,
                'file_id': file_id,
                'image_data': f"data:image/jpeg;base64,{image_base64}",
                'width': width,
                'height': height,
                'message': 'Image uploaded successfully'
            })
            
        except Exception as e:
            return jsonify({'error': f'Invalid image file: {str(e)}'}), 400
            
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
        
        # Get image path
        upload_dir = os.path.join(current_app.root_path, 'uploads')
        image_path = os.path.join(upload_dir, f"{file_id}.jpg")
        
        if not os.path.exists(image_path):
            return jsonify({'error': 'Image file not found'}), 404
        
        # Use AI service to detect people
        detected_people = ai_services['person_detector'].detect_people(image_path)
        
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
        quality_mode = data.get('quality_mode', 'fast')  # 'fast' or 'quality'
        
        if not file_id:
            return jsonify({'error': 'No file_id provided'}), 400
        
        if not selected_people:
            return jsonify({'error': 'No people selected for removal'}), 400
        
        # Get image path
        upload_dir = os.path.join(current_app.root_path, 'uploads')
        image_path = os.path.join(upload_dir, f"{file_id}.jpg")
        
        if not os.path.exists(image_path):
            return jsonify({'error': 'Original image not found'}), 404
        
        # Use AI service to remove people
        processed_image_data = ai_services['image_processor'].remove_people(
            image_path, people_data, selected_people, quality_mode
        )
        
        # Generate result filename and save
        result_id = str(uuid.uuid4())
        result_path = os.path.join(upload_dir, f"{result_id}_result.jpg")
        
        with open(result_path, 'wb') as f:
            f.write(processed_image_data)
        
        # Convert to base64 for frontend
        image_base64 = base64.b64encode(processed_image_data).decode('utf-8')
        
        return jsonify({
            'success': True,
            'result_id': result_id,
            'result_image': f"data:image/jpeg;base64,{image_base64}",
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
        'ai_services': {
            'person_detection': 'Roboflow People Detection API',
            'image_processing': 'ClipDrop Cleanup API',
            'mask_generation': 'Segmind Automatic Mask Generator'
        },
        'endpoints': {
            'upload': '/api/image/upload',
            'detect': '/api/image/detect-people',
            'remove': '/api/image/remove-people',
            'download': '/api/image/download/<result_id>'
        }
    })

