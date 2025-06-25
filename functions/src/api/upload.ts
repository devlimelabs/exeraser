import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";
import Busboy from "busboy";
import { v4 as uuidv4 } from "uuid";
import { CORS_OPTIONS, ERROR_MESSAGES, IMAGE_PROCESSING, STORAGE_PATHS } from "../config/constants";

const corsHandler = cors(CORS_OPTIONS);

export const uploadImage = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const busboy = Busboy({ headers: req.headers });
    const uploadId = uuidv4();
    let fileUploaded = false;

    const bucket = admin.storage().bucket();

    busboy.on("file", (fieldname: string, file: any, filename: any, encoding: string, mimetype: string) => {
      // Validate file type
      if (!IMAGE_PROCESSING.ALLOWED_TYPES.includes(mimetype as any)) {
        res.status(400).json({ error: ERROR_MESSAGES.INVALID_IMAGE });
        return;
      }

      const filepath = `${STORAGE_PATHS.TEMP}/${uploadId}/${filename.filename}`;
      const fileUpload = bucket.file(filepath);

      let totalBytes = 0;

      file.on("data", (data: Buffer) => {
        totalBytes += data.length;
        
        // Check file size
        if (totalBytes > IMAGE_PROCESSING.MAX_SIZE_BYTES) {
          file.resume(); // Drain the stream
          res.status(400).json({ error: ERROR_MESSAGES.IMAGE_TOO_LARGE });
          return;
        }
      });

      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: mimetype,
          metadata: {
            uploadId,
            originalName: filename.filename,
            uploadTime: new Date().toISOString(),
          },
        },
      });

      file.pipe(stream);

      stream.on("error", (error) => {
        console.error("Upload error:", error);
        res.status(500).json({ error: ERROR_MESSAGES.PROCESSING_FAILED });
      });

      stream.on("finish", async () => {
        fileUploaded = true;
        
        // Make the file publicly accessible
        await fileUpload.makePublic();
        
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filepath}`;
        
        res.json({
          uploadId,
          filename: filename.filename,
          url: publicUrl,
          message: "Image uploaded successfully",
        });
      });
    });

    busboy.on("finish", () => {
      if (!fileUploaded) {
        res.status(400).json({ error: ERROR_MESSAGES.NO_IMAGE_PROVIDED });
      }
    });

    busboy.end(req.rawBody);
  });
});