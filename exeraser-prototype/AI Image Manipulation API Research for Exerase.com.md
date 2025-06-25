# AI Image Manipulation API Research for Exerase.com

## Project Requirements
- Website called exerase.com
- AI image manipulation to remove people from photos
- Easy image upload interface
- AI pre-outline all people in images
- Click-to-select person removal
- AI background repair after removal
- Suggested models: OpenAI GPT-Image-1, Imagen 4, Flux Kontext Max

## Key APIs and Services Found

### 1. Cleanup.pictures (ClipDrop API)
- **URL**: https://clipdrop.co/apis/docs/cleanup
- **Capabilities**: Remove objects, people, text from images using inpainting
- **API Endpoint**: https://clipdrop-api.co/cleanup/v1
- **Input**: Original image + mask image (PNG, black/white, same resolution)
- **Output**: PNG image with removed content and repaired background
- **Pricing**: 1 credit per call
  - 100 credits: $50 ($0.50/credit)
  - 1,000 credits: $320 ($0.32/credit)
  - 5,000 credits: $800 ($0.16/credit)
  - 25,000 credits: $3,600 ($0.144/credit)
- **Modes**: Fast (default) vs Quality (slower but better results)
- **Limitations**: Max 16MP, 30MB file size

### 2. Google Cloud Vertex AI Imagen
- **URL**: https://cloud.google.com/vertex-ai/generative-ai/docs/image/edit-remove-objects
- **Capabilities**: Remove objects using inpainting with defined or automatic mask detection
- **Features**: 
  - Bring your own mask OR automatic mask generation
  - Text prompt support for better results
  - High-quality background repair
- **Limitations**: 
  - Some pixels outside mask may change slightly
  - Small adjacent objects may be removed
  - Large outdoor sky areas may have artifacts

### 3. Roboflow People Detection API
- **URL**: https://blog.roboflow.com/people-detection-api/
- **Capabilities**: Detect and locate all people in images
- **Performance**: 89.4% mAP, 85.6% accuracy on 19,233 training images
- **Output**: JSON with bounding box coordinates (x, y, width, height, confidence)
- **Integration**: Python SDK, web browser, iOS, edge devices
- **Use Case**: Perfect for pre-outlining people in images

### 4. OpenAI Image Editing
- **Status**: Limited inpainting capabilities mentioned in community forums
- **Note**: DALL-E 3 has editing interface but may not be suitable for precise object removal

## Technical Architecture Recommendations

### Frontend Requirements
1. **Image Upload**: Drag & drop interface
2. **Person Detection**: Automatic outlining using Roboflow API
3. **Selection Interface**: Click-to-select detected people
4. **Mask Generation**: Convert selections to binary masks
5. **Preview**: Show before/after results

### Backend Requirements
1. **Image Processing**: Handle uploads, resizing, format conversion
2. **Person Detection**: Integrate Roboflow API for automatic detection
3. **Mask Creation**: Generate binary masks from user selections
4. **Object Removal**: Use ClipDrop or Imagen API for inpainting
5. **Result Management**: Store and serve processed images

### Recommended API Combination
1. **Roboflow People Detection API** - For automatic person detection and outlining
2. **ClipDrop Cleanup API** - For object removal and background repair
3. **Alternative**: Google Vertex AI Imagen - For more advanced inpainting

### Cost Analysis (ClipDrop)
- Small scale (100 images/month): $50/month
- Medium scale (1,000 images/month): $320/month  
- Large scale (5,000 images/month): $800/month

### Technical Considerations
1. **Image Formats**: Support JPG, PNG input; PNG output for transparency
2. **File Size Limits**: Max 16MP, 30MB per ClipDrop requirements
3. **Processing Time**: Fast mode vs Quality mode trade-offs
4. **Error Handling**: API rate limits, failed requests, invalid images
5. **User Experience**: Progress indicators, preview capabilities

