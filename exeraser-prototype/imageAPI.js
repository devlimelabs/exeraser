const API_BASE_URL = '/api/image'

class ImageProcessingAPI {
  async uploadImage(file) {
    const formData = new FormData()
    formData.append('image', file)
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }
    
    return await response.json()
  }
  
  async detectPeople(fileId) {
    const response = await fetch(`${API_BASE_URL}/detect-people`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ file_id: fileId })
    })
    
    if (!response.ok) {
      throw new Error(`Detection failed: ${response.statusText}`)
    }
    
    return await response.json()
  }
  
  async removePeople(fileId, selectedPeople, peopleData, qualityMode = 'fast') {
    const response = await fetch(`${API_BASE_URL}/remove-people`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        file_id: fileId,
        selected_people: selectedPeople,
        people_data: peopleData,
        quality_mode: qualityMode
      })
    })
    
    if (!response.ok) {
      throw new Error(`Processing failed: ${response.statusText}`)
    }
    
    return await response.json()
  }
  
  getDownloadUrl(resultId) {
    return `${API_BASE_URL}/download/${resultId}`
  }
  
  async getStatus() {
    const response = await fetch(`${API_BASE_URL}/status`)
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`)
    }
    
    return await response.json()
  }
}

export const imageAPI = new ImageProcessingAPI()

