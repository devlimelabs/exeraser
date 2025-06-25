import os
import requests
import base64
import json
from io import BytesIO
from PIL import Image, ImageDraw
import numpy as np

class RoboflowPersonDetector:
    """Roboflow People Detection API integration"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('ROBOFLOW_API_KEY')
        self.base_url = "https://detect.roboflow.com/people-detection-general/5"
        
    def detect_people(self, image_path):
        """Detect people in an image using Roboflow API"""
        try:
            if not self.api_key:
                # Return mock data if no API key
                return self._get_mock_detection()
            
            # Convert image to base64
            with open(image_path, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
            
            # Make API request
            response = requests.post(
                f"{self.base_url}?api_key={self.api_key}",
                data=image_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                result = response.json()
                return self._format_detection_result(result)
            else:
                print(f"Roboflow API error: {response.status_code}")
                return self._get_mock_detection()
                
        except Exception as e:
            print(f"Person detection error: {e}")
            return self._get_mock_detection()
    
    def _format_detection_result(self, result):
        """Format Roboflow API response to our format"""
        people = []
        image_width = result.get('image', {}).get('width', 1)
        image_height = result.get('image', {}).get('height', 1)
        
        for i, prediction in enumerate(result.get('predictions', [])):
            # Convert absolute coordinates to percentages
            x_center = prediction['x']
            y_center = prediction['y']
            width = prediction['width']
            height = prediction['height']
            
            # Convert to top-left corner and percentages
            x_percent = ((x_center - width/2) / image_width) * 100
            y_percent = ((y_center - height/2) / image_height) * 100
            width_percent = (width / image_width) * 100
            height_percent = (height / image_height) * 100
            
            people.append({
                'id': i + 1,
                'x': max(0, x_percent),
                'y': max(0, y_percent),
                'width': width_percent,
                'height': height_percent,
                'confidence': prediction['confidence']
            })
        
        return people
    
    def _get_mock_detection(self):
        """Return mock detection data for testing"""
        return [
            {"id": 1, "x": 25, "y": 30, "width": 20, "height": 40, "confidence": 0.95},
            {"id": 2, "x": 55, "y": 25, "width": 18, "height": 45, "confidence": 0.88},
            {"id": 3, "x": 75, "y": 35, "width": 15, "height": 35, "confidence": 0.92}
        ]

class ClipDropImageProcessor:
    """ClipDrop Cleanup API integration"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('CLIPDROP_API_KEY')
        self.base_url = "https://clipdrop-api.co/cleanup/v1"
        
    def remove_people(self, image_path, people_data, selected_people, quality_mode='fast'):
        """Remove selected people from image using ClipDrop API"""
        try:
            if not self.api_key:
                # Return original image if no API key
                return self._copy_original_image(image_path)
            
            # Create mask for selected people
            mask_path = self._create_mask(image_path, people_data, selected_people)
            
            # Prepare files for API request
            with open(image_path, 'rb') as image_file:
                with open(mask_path, 'rb') as mask_file:
                    files = {
                        'image_file': image_file,
                        'mask_file': mask_file
                    }
                    
                    data = {
                        'mode': quality_mode
                    }
                    
                    headers = {
                        'x-api-key': self.api_key
                    }
                    
                    response = requests.post(
                        self.base_url,
                        files=files,
                        data=data,
                        headers=headers
                    )
                    
                    if response.status_code == 200:
                        return response.content
                    else:
                        print(f"ClipDrop API error: {response.status_code}")
                        return self._copy_original_image(image_path)
                        
        except Exception as e:
            print(f"Image processing error: {e}")
            return self._copy_original_image(image_path)
        finally:
            # Clean up temporary mask file
            if 'mask_path' in locals() and os.path.exists(mask_path):
                os.remove(mask_path)
    
    def _create_mask(self, image_path, people_data, selected_people):
        """Create a binary mask for selected people"""
        # Load original image to get dimensions
        with Image.open(image_path) as img:
            width, height = img.size
        
        # Create black mask
        mask = Image.new('RGB', (width, height), (0, 0, 0))
        draw = ImageDraw.Draw(mask)
        
        # Draw white rectangles for selected people
        for person in people_data:
            if person['id'] in selected_people:
                # Convert percentages back to pixels
                x = int((person['x'] / 100) * width)
                y = int((person['y'] / 100) * height)
                w = int((person['width'] / 100) * width)
                h = int((person['height'] / 100) * height)
                
                # Draw white rectangle (area to be removed)
                draw.rectangle([x, y, x + w, y + h], fill=(255, 255, 255))
        
        # Save mask temporarily
        mask_path = image_path.replace('.jpg', '_mask.png')
        mask.save(mask_path, 'PNG')
        return mask_path
    
    def _copy_original_image(self, image_path):
        """Return original image data when API is not available"""
        with open(image_path, 'rb') as f:
            return f.read()

class SegmindMaskGenerator:
    """Segmind Automatic Mask Generator API integration"""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('SEGMIND_API_KEY')
        self.base_url = "https://api.segmind.com/v1/automatic-mask-generator"
    
    def generate_person_masks(self, image_path):
        """Generate masks for people using Segmind API"""
        try:
            if not self.api_key:
                return None
            
            # Convert image to base64
            with open(image_path, 'rb') as f:
                image_data = base64.b64encode(f.read()).decode('utf-8')
            
            data = {
                "prompt": "person",
                "image": image_data,
                "threshold": 0.2,
                "invert_mask": False,
                "return_mask": True,
                "return_alpha": False,
                "grow_mask": 10,
                "seed": 468685,
                "base64": True
            }
            
            headers = {'x-api-key': self.api_key}
            
            response = requests.post(self.base_url, json=data, headers=headers)
            
            if response.status_code == 200:
                return response.content
            else:
                print(f"Segmind API error: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Mask generation error: {e}")
            return None

# Factory function to create AI service instances
def create_ai_services():
    """Create and return AI service instances"""
    return {
        'person_detector': RoboflowPersonDetector(),
        'image_processor': ClipDropImageProcessor(),
        'mask_generator': SegmindMaskGenerator()
    }

