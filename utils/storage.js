import multer from 'multer';
import fs from 'fs';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './upload';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const randomFileName =
            [...Array(8)].map(() => Math.random().toString(36)[2]).join('') +
            path.extname(file.originalname);
        cb(null, randomFileName);
    },
});

export const upload = multer({ storage });
