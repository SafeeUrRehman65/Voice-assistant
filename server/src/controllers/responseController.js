import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { error } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioDir = path.join(__dirname, "../audio");

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
  console.log("Created audio directory:", audioDir);
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"), false);
    }
  },
});

export const sendTranscript = async (req, res) => {
  try {
    upload.single("audio")(req, res, async function (err) {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({
          message: "File upload error",
          error: err.message,
        });
      }
      console.log("Request", req);
      if (!req.file) {
        return res.status(400).json({ message: "Audio file is missing" });
      }

      try {
        console.log("Audio data recieved, size:", req.file.size);
        const formData = new FormData();
        // const blob = new Blob([req.file.buffer], { type: "audio/wav" });
        // formData.append("audio", blob, "recording.wav");

        const timestamp = Date.now();
        const filename = "audio.wav";
        const filepath = path.join(audioDir, filename);

        fs.writeFileSync(filepath, req.file.buffer);
        console.log("Audio saved to:", filepath);

        formData.append("audio", req.file.buffer, "recording.wav");
        const response = await axios.post(
          "http://localhost:8000/execute-pipeline",
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const response_data = response.data;

        if (!response_data) {
          console.log("Response Data not available");
          return res.status(500).json({
            message: "Response Data not available",
            error: error.message,
          });
        }

        console.log("Response Data recieved successfully");

        console.log(response_data);

        return res.status(200).json({
          success: true,
          response_data: response_data,
          message: "Audio processing completed",
        });
      } catch (error) {
        console.error("Pipeline error:", error.message);
        return res.status(500).json({
          message: "Failed to get AI Response",
          error: error.message,
        });
      }
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to get AI Response", error: error.message });
  }
};
