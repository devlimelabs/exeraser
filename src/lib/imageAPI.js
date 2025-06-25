// Firebase Functions base URL
// Update this with your actual Firebase project URL
const FIREBASE_FUNCTIONS_BASE_URL = 'https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net'

class ImageProcessingAPI {
  async uploadImage(file) {
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await fetch(`${FIREBASE_FUNCTIONS_BASE_URL}/uploadImage`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    return {
      file_id: result.uploadId,
      filename: result.filename,
      url: result.url
    }
  }
  
  async detectPeople(fileId, imageUrl) {
    const response = await fetch(`${FIREBASE_FUNCTIONS_BASE_URL}/detectPeopleInImage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        uploadId: fileId,
        imageUrl: imageUrl
      })
    })
    
    if (!response.ok) {
      throw new Error(`Detection failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    return {
      predictions: result.predictions,
      imageWidth: result.imageWidth,
      imageHeight: result.imageHeight
    }
  }
  
  async removePeople(fileId, imageUrl, selectedPeople, peopleData, qualityMode = 'high') {
    const response = await fetch(`${FIREBASE_FUNCTIONS_BASE_URL}/processImageRemoval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uploadId: fileId,
        imageUrl: imageUrl,
        selectedPeople: selectedPeople,
        quality: qualityMode
      })
    })
    
    if (!response.ok) {
      throw new Error(`Processing failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    return {
      result_id: result.resultId,
      processed_url: result.processedUrl,
      success: result.success
    }
  }
  
  async getDownloadUrl(resultId, uploadId) {
    const response = await fetch(`${FIREBASE_FUNCTIONS_BASE_URL}/downloadResult?resultId=${resultId}&uploadId=${uploadId}`, {
      method: 'GET'
    })
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    return result.downloadUrl
  }
  
  async getStatus() {
    const response = await fetch(`${FIREBASE_FUNCTIONS_BASE_URL}/healthCheck`)
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`)
    }
    
    return await response.json()
  }
}

export const imageAPI = new ImageProcessingAPI()