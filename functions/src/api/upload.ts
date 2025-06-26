import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Busboy from "busboy";
import { v4 as uuidv4 } from "uuid";
import { ERROR_MESSAGES, IMAGE_PROCESSING, STORAGE_PATHS } from "../config/constants";

export const uploadImage = onRequest(
  { cors: true },
  async (req, res) => {
    console.log("Upload request received:", {
      method: req.method,
      headers: req.headers,
      contentType: req.headers["content-type"],
    });

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const busboy = Busboy({ headers: req.headers });
    const uploadId = uuidv4();
    let fileUploaded = false;

    const bucket = admin.storage().bucket();

    busboy.on("file", (fieldname: string, file: any, fileInfo: any) => {
      const { filename, mimeType } = fileInfo;
      console.log("Processing file:", { filename, mimeType, fieldname });
      
      // Validate file type
      if (!IMAGE_PROCESSING.ALLOWED_TYPES.includes(mimeType as any)) {
        console.error("Invalid file type:", mimeType);
        res.status(400).json({ error: ERROR_MESSAGES.INVALID_IMAGE });
        return;
      }

      const filepath = `${STORAGE_PATHS.TEMP}/${uploadId}/${filename}`;
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
          contentType: mimeType,
          metadata: {
            uploadId,
            originalName: filename,
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
          filename: filename,
          url: publicUrl,
          message: "Image uploaded successfully",
        });
      });
    });

    busboy.on("finish", () => {
      if (!fileUploaded) {
        console.log("No file was uploaded");
        res.status(400).json({ error: ERROR_MESSAGES.NO_IMAGE_PROVIDED });
      }
    });

    busboy.on("error", (error: Error) => {
      console.error("Busboy error:", error);
      res.status(400).json({ error: "Failed to parse upload" });
    });

    try {
      busboy.end(req.rawBody);
    } catch (error) {
      console.error("Failed to process request body:", error);
      res.status(400).json({ error: "Invalid request format" });
    }
  }
);