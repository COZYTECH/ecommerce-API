import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

export default upload;

// const upload = multer({
//     +  storage,
//     +  limits: {
//     +    fileSize: 5 * 1024 * 1024, // 5MB per file (adjust as needed)
//     +  },
//     +  fileFilter: (req, file, cb) => {
//     +    if (!file.mimetype.startsWith("image/")) {
//     +      return cb(new Error("Only image uploads are allowed"), false);
//     +    }
//     +    cb(null, true);
//     +  },
//     +});
