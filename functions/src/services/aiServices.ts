import axios from "axios";
import sharp from "sharp";
import FormData from "form-data";
import { roboflowApiKey, roboflowModel, clipdropApiKey } from "../config/params";

interface Prediction {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  detection_id: string;
}

interface DetectionResult {
  predictions: Prediction[];
  image?: {
    width: number;
    height: number;
  };
}

/**
 * Detect people in an image using Roboflow API
 */
export async function detectPeople(imageUrl: string): Promise<DetectionResult> {
  try {
    const apiKey = roboflowApiKey.value();
    const modelId = roboflowModel.value();
    
    // For demo purposes, return mock data if API key is not set
    if (!apiKey || apiKey === "demo") {
      return getMockDetectionResult();
    }

    console.log("Detecting people with Roboflow:", {
      modelId,
      imageUrl,
      endpoint: `https://serverless.roboflow.com/${modelId}`
    });

    // Use serverless endpoint with image URL as query parameter
    const response = await axios.post(
      `https://serverless.roboflow.com/${modelId}`,
      null, // No body for URL-based detection
      {
        params: { 
          api_key: apiKey,
          image: imageUrl
        }
      }
    );

    console.log("Roboflow response:", response.data);

    return response.data;
  } catch (error: any) {
    console.error("Roboflow detection error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error("Failed to detect people in image");
  }
}

/**
 * Remove background/people from image using ClipDrop API
 */
export async function removeBackground(
  imageUrl: string,
  selectedPeople: string[],
  predictions: Prediction[],
  quality: string
): Promise<Buffer> {
  try {
    const apiKey = clipdropApiKey.value();
    
    // For demo purposes, return original image if API key is not set
    if (!apiKey || apiKey === "demo") {
      return await downloadImage(imageUrl);
    }

    // Download the original image
    const imageBuffer = await downloadImage(imageUrl);
    
    // Get image dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Create mask for selected people
    const maskBuffer = await createMask(predictions, selectedPeople, width, height);

    // Use ClipDrop cleanup API with Node.js FormData
    const formData = new FormData();
    formData.append("image_file", imageBuffer, {
      filename: "image.jpg",
      contentType: "image/jpeg",
    });
    formData.append("mask_file", maskBuffer, {
      filename: "mask.png",
      contentType: "image/png",
    });
    formData.append("mode", quality === "high" ? "quality" : "fast");

    console.log("Calling ClipDrop API with:", {
      imageSize: imageBuffer.length,
      maskSize: maskBuffer.length,
      quality,
      selectedPeople: selectedPeople.length
    });

    const response = await axios.post(
      "https://clipdrop-api.co/cleanup/v1",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          "x-api-key": apiKey,
        },
        responseType: "arraybuffer",
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    console.log("ClipDrop API response received, size:", response.data.length);
    return Buffer.from(response.data);
  } catch (error: any) {
    console.error("ClipDrop removal error:", {
      message: error.message,
      response: error.response?.data?.toString(),
      status: error.response?.status,
      headers: error.response?.headers
    });
    throw new Error("Failed to process image removal");
  }
}

/**
 * Create a mask image for the selected people
 * ClipDrop expects: black (0) = keep, white (255) = remove
 */
async function createMask(
  predictions: Prediction[],
  selectedPeople: string[],
  width: number,
  height: number
): Promise<Buffer> {
  console.log("Creating mask for selected people:", {
    totalPredictions: predictions.length,
    selectedCount: selectedPeople.length,
    imageSize: { width, height }
  });

  // Create a black mask (all pixels to keep)
  const mask = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  });

  // Create white rectangles for selected people (areas to remove)
  // Expand the mask by 15% as recommended by ClipDrop docs
  const expansionFactor = 1.15;
  
  const composites = predictions
    .filter((pred) => selectedPeople.includes(pred.detection_id))
    .map((pred) => {
      const expandedWidth = Math.round(pred.width * expansionFactor);
      const expandedHeight = Math.round(pred.height * expansionFactor);
      
      const rect = Buffer.from(
        `<svg width="${expandedWidth}" height="${expandedHeight}">
          <rect x="0" y="0" width="${expandedWidth}" height="${expandedHeight}" fill="white"/>
        </svg>`
      );

      return {
        input: rect,
        left: Math.round(pred.x - expandedWidth / 2),
        top: Math.round(pred.y - expandedHeight / 2),
      };
    });

  console.log("Mask composites created:", composites.length);

  if (composites.length > 0) {
    return await mask.composite(composites).png().toBuffer();
  }

  return await mask.png().toBuffer();
}

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
  });
  return Buffer.from(response.data);
}

/**
 * Get mock detection result for demo purposes
 */
function getMockDetectionResult(): DetectionResult {
  return {
    predictions: [
      {
        x: 300,
        y: 250,
        width: 120,
        height: 280,
        confidence: 0.95,
        class: "person",
        detection_id: "person_1",
      },
      {
        x: 500,
        y: 260,
        width: 110,
        height: 270,
        confidence: 0.92,
        class: "person",
        detection_id: "person_2",
      },
    ],
    image: {
      width: 800,
      height: 600,
    },
  };
}