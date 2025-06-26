import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

// Firebase Functions base URL
// Update this with your actual Firebase project URL
const FIREBASE_FUNCTIONS_BASE_URL = 'https://us-central1-exeraser.cloudfunctions.net'

class ImageProcessingAPI {
  async uploadImage(file) {
    // Generate unique upload ID and filename
    const uploadId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${uploadId}.${extension}`
    
    // Create storage reference
    const storageRef = ref(storage, `temp/${uploadId}/${filename}`)
    
    // Upload file with resumable upload
    const uploadTask = uploadBytesResumable(storageRef, file)
    
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress tracking (optional - can emit events here)
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log('Upload progress:', progress + '%')
        },
        (error) => {
          // Handle upload errors
          console.error('Upload error:', error)
          reject(new Error(`Upload failed: ${error.message}`))
        },
        async () => {
          // Upload completed successfully, get download URL
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref)
            resolve({
              file_id: uploadId,
              filename: filename,
              url: downloadUrl
            })
          } catch (error) {
            reject(new Error(`Failed to get download URL: ${error.message}`))
          }
        }
      )
    })
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