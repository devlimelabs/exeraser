import * as functions from "firebase-functions";
import cors from "cors";
import { CORS_OPTIONS, ERROR_MESSAGES, COLLECTIONS, PROCESSING_STATUS } from "../config/constants";
import { roboflowApiKey } from "../config/params";
import { detectPeople } from "../services/aiServices";
import * as admin from "firebase-admin";

const corsHandler = cors(CORS_OPTIONS);

export const detectPeopleInImage = functions
  .runWith({
    secrets: [roboflowApiKey],
  })
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
      }

      try {
        const { imageUrl, uploadId } = req.body;

        if (!imageUrl || !uploadId) {
          res.status(400).json({ error: ERROR_MESSAGES.INVALID_REQUEST });
          return;
        }

        // Update processing status
        const processingRef = admin.firestore()
          .collection(COLLECTIONS.PROCESSING)
          .doc(uploadId);

        await processingRef.set({
          status: PROCESSING_STATUS.DETECTING,
          imageUrl,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Detect people using AI service
        const detectionResult = await detectPeople(imageUrl);

        if (!detectionResult.predictions || detectionResult.predictions.length === 0) {
          await processingRef.update({
            status: PROCESSING_STATUS.COMPLETED,
            detectionResult: {
              predictions: [],
              message: ERROR_MESSAGES.NO_PEOPLE_DETECTED,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          res.json({
            uploadId,
            predictions: [],
            message: ERROR_MESSAGES.NO_PEOPLE_DETECTED,
          });
          return;
        }

        // Store detection results
        await processingRef.update({
          status: PROCESSING_STATUS.COMPLETED,
          detectionResult,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({
          uploadId,
          predictions: detectionResult.predictions,
          imageWidth: detectionResult.image?.width || 0,
          imageHeight: detectionResult.image?.height || 0,
        });

      } catch (error) {
        console.error("Detection error:", error);
        res.status(500).json({ error: ERROR_MESSAGES.DETECTION_FAILED });
      }
    });
  });