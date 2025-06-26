import axios from "axios";
import sharp from "sharp";
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

    // Use ClipDrop cleanup API
    const formData = new FormData();
    formData.append("image_file", new Blob([imageBuffer]), "image.jpg");
    formData.append("mask_file", new Blob([maskBuffer]), "mask.png");

    const response = await axios.post(
      "https://clipdrop-api.co/cleanup/v1",
      formData,
      {
        headers: {
          "x-api-key": apiKey,
        },
        responseType: "arraybuffer",
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    console.error("ClipDrop removal error:", error);
    throw new Error("Failed to process image removal");
  }
}

/**
 * Create a mask image for the selected people
 */
async function createMask(
  predictions: Prediction[],
  selectedPeople: string[],
  width: number,
  height: number
): Promise<Buffer> {
  // Create a blank mask
  const mask = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  // Create white rectangles for selected people
  const composites = predictions
    .filter((pred) => selectedPeople.includes(pred.detection_id))
    .map((pred) => {
      const rect = Buffer.from(
        `<svg width="${pred.width}" height="${pred.height}">
          <rect x="0" y="0" width="${pred.width}" height="${pred.height}" fill="white"/>
        </svg>`
      );

      return {
        input: rect,
        left: Math.round(pred.x - pred.width / 2),
        top: Math.round(pred.y - pred.height / 2),
      };
    });

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