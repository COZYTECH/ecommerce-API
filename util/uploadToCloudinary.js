//This helper converts Multer buffer into a Cloudinary upload.
import cloudinary from "./cloudinary.js";
import { Readable } from "stream";

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );

    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(stream);
  });
};
export default uploadToCloudinary;
