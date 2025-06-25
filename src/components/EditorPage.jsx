import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  Brain, 
  MousePointer, 
  Download, 
  ArrowLeft, 
  Settings,
  Zap,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { imageAPI } from '../lib/imageAPI'

const EditorPage = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  
  const [currentStep, setCurrentStep] = useState('upload') // upload, detect, select, process, complete
  const [uploadedImage, setUploadedImage] = useState(null)
  const [fileId, setFileId] = useState(null)
  const [detectedPeople, setDetectedPeople] = useState([])
  const [selectedPeople, setSelectedPeople] = useState([])
  const [processedImage, setProcessedImage] = useState(null)
  const [resultId, setResultId] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [error, setError] = useState(null)
  const [qualityMode, setQualityMode] = useState('fast')

  const handleFileUpload = useCallback(async (file) => {
    if (file && file.type.startsWith('image/')) {
      try {
        setError(null)
        setCurrentStep('detect')
        
        // Upload image to backend
        const uploadResult = await imageAPI.uploadImage(file)
        
        if (uploadResult.file_id) {
          setUploadedImage(uploadResult.url)
          setFileId(uploadResult.file_id)
          
          // Automatically start person detection
          setTimeout(() => {
            detectPeople(uploadResult.file_id, uploadResult.url)
          }, 1000)
        } else {
          throw new Error('Upload failed')
        }
      } catch (err) {
        setError(`Upload failed: ${err.message}`)
        setCurrentStep('upload')
      }
    }
  }, [])

  const detectPeople = async (fileId, imageUrl) => {
    try {
      setError(null)
      const detectionResult = await imageAPI.detectPeople(fileId, imageUrl)
      
      if (detectionResult.predictions) {
        // Transform predictions to match the expected format
        const people = detectionResult.predictions.map((pred, index) => ({
          id: index + 1,
          x: (pred.bbox[0] / detectionResult.imageWidth) * 100,
          y: (pred.bbox[1] / detectionResult.imageHeight) * 100,
          width: ((pred.bbox[2] - pred.bbox[0]) / detectionResult.imageWidth) * 100,
          height: ((pred.bbox[3] - pred.bbox[1]) / detectionResult.imageHeight) * 100,
          confidence: pred.score
        }))
        setDetectedPeople(people)
        setCurrentStep('select')
      } else {
        throw new Error('No people detected')
      }
    } catch (err) {
      setError(`Detection failed: ${err.message}`)
      setCurrentStep('upload')
    }
  }

  const handlePersonSelect = (personId) => {
    setSelectedPeople(prev => 
      prev.includes(personId) 
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    )
  }

  const handleRemovePeople = async () => {
    if (selectedPeople.length === 0) return
    
    try {
      setError(null)
      setIsProcessing(true)
      setCurrentStep('process')
      setProcessingProgress(0)

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const result = await imageAPI.removePeople(
        fileId,
        uploadedImage,
        selectedPeople, 
        detectedPeople, 
        qualityMode
      )

      clearInterval(progressInterval)
      setProcessingProgress(100)

      if (result.success) {
        setProcessedImage(result.processed_url)
        setResultId(result.result_id)
        setCurrentStep('complete')
      } else {
        throw new Error('Processing failed')
      }
    } catch (err) {
      setError(`Processing failed: ${err.message}`)
      setCurrentStep('select')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = async () => {
    if (resultId && fileId) {
      try {
        const downloadUrl = await imageAPI.getDownloadUrl(resultId, fileId)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = `exerase_result_${resultId}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } catch (err) {
        setError(`Download failed: ${err.message}`)
      }
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const resetEditor = () => {
    setCurrentStep('upload')
    setUploadedImage(null)
    setFileId(null)
    setDetectedPeople([])
    setSelectedPeople([])
    setProcessedImage(null)
    setResultId(null)
    setIsProcessing(false)
    setProcessingProgress(0)
    setError(null)
  }

  const getStepIcon = (step) => {
    switch (step) {
      case 'upload': return Upload
      case 'detect': return Brain
      case 'select': return MousePointer
      case 'process': return Sparkles
      case 'complete': return CheckCircle
      default: return Upload
    }
  }

  const getStepTitle = (step) => {
    switch (step) {
      case 'upload': return 'Upload Photo'
      case 'detect': return 'AI Detection'
      case 'select': return 'Select People'
      case 'process': return 'Processing'
      case 'complete': return 'Complete'
      default: return 'Upload Photo'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="text-xl font-bold">Exerase</span>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="hidden md:flex items-center space-x-4">
            {['upload', 'detect', 'select', 'process', 'complete'].map((step, index) => {
              const Icon = getStepIcon(step)
              const isActive = currentStep === step
              const isCompleted = ['upload', 'detect', 'select', 'process', 'complete'].indexOf(currentStep) > index
              
              return (
                <div key={step} className="flex items-center">
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-primary text-white' : 
                    isCompleted ? 'bg-accent text-white' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{getStepTitle(step)}</span>
                  </div>
                  {index < 4 && (
                    <div className={`w-8 h-0.5 mx-2 ${
                      isCompleted ? 'bg-accent' : 'bg-muted'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>

          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-80 border-r bg-muted/30 p-6">
          <div className="space-y-6">
            {/* Error Display */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upload Section */}
            {currentStep === 'upload' && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Upload Your Photo</h3>
                  <div 
                    className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag & drop your photo here
                    </p>
                    <p className="text-xs text-muted-foreground">
                      or click to browse
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </CardContent>
              </Card>
            )}

            {/* Detection Section */}
            {currentStep === 'detect' && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">AI Detection</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    <Brain className="h-8 w-8 text-primary animate-pulse" />
                    <div>
                      <p className="font-medium">Analyzing photo...</p>
                      <p className="text-sm text-muted-foreground">Detecting people in image</p>
                    </div>
                  </div>
                  <Progress value={75} className="mb-2" />
                  <p className="text-xs text-muted-foreground">Using AI to identify people</p>
                </CardContent>
              </Card>
            )}

            {/* Selection Section */}
            {currentStep === 'select' && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Select People to Remove</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Click on the outlined people in the image to select them for removal.
                  </p>
                  <div className="space-y-2 mb-4">
                    {detectedPeople.map((person) => (
                      <div 
                        key={person.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPeople.includes(person.id) 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handlePersonSelect(person.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedPeople.includes(person.id) 
                              ? 'bg-primary border-primary' 
                              : 'border-muted-foreground'
                          }`} />
                          <span className="text-sm">Person {person.id}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(person.confidence * 100)}% confidence
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleRemovePeople}
                    disabled={selectedPeople.length === 0}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Remove Selected ({selectedPeople.length})
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Processing Section */}
            {currentStep === 'process' && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Processing</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    <Sparkles className="h-8 w-8 text-primary animate-spin" />
                    <div>
                      <p className="font-medium">AI is working its magic...</p>
                      <p className="text-sm text-muted-foreground">Removing people and repairing background</p>
                    </div>
                  </div>
                  <Progress value={processingProgress} className="mb-2" />
                  <p className="text-xs text-muted-foreground">{processingProgress}% complete</p>
                </CardContent>
              </Card>
            )}

            {/* Complete Section */}
            {currentStep === 'complete' && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Processing Complete!</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    <CheckCircle className="h-8 w-8 text-accent" />
                    <div>
                      <p className="font-medium">Your photo is ready</p>
                      <p className="text-sm text-muted-foreground">People removed successfully</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Button className="w-full" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Result
                    </Button>
                    <Button variant="outline" className="w-full" onClick={resetEditor}>
                      Edit Another Photo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quality Settings */}
            {(currentStep === 'select' || currentStep === 'complete') && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Quality Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Processing Mode</span>
                      <div className="flex space-x-2">
                        <Button 
                          variant={qualityMode === 'fast' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setQualityMode('fast')}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Fast
                        </Button>
                        <Button 
                          variant={qualityMode === 'quality' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setQualityMode('quality')}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Quality
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 p-6">
          <Card className="h-full">
            <CardContent className="p-6 h-full">
              {!uploadedImage ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Upload a photo to get started</h3>
                    <p className="text-muted-foreground">
                      Drag and drop an image or use the upload button in the sidebar
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="relative max-w-full max-h-full">
                    <img 
                      src={currentStep === 'complete' ? processedImage : uploadedImage}
                      alt="Uploaded photo" 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    />
                    
                    {/* Person Detection Overlays */}
                    {currentStep === 'select' && detectedPeople.map((person) => (
                      <div
                        key={person.id}
                        className={`absolute border-2 rounded cursor-pointer transition-all ${
                          selectedPeople.includes(person.id)
                            ? 'border-primary bg-primary/20'
                            : 'border-accent hover:border-primary'
                        }`}
                        style={{
                          left: `${person.x}%`,
                          top: `${person.y}%`,
                          width: `${person.width}%`,
                          height: `${person.height}%`,
                        }}
                        onClick={() => handlePersonSelect(person.id)}
                      >
                        <div className={`absolute -top-6 left-0 px-2 py-1 rounded text-xs font-medium ${
                          selectedPeople.includes(person.id)
                            ? 'bg-primary text-white'
                            : 'bg-accent text-white'
                        }`}>
                          {person.id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default EditorPage