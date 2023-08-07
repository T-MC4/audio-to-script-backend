import multer from 'multer';
import fs from 'fs';
import path from 'path';

export const storage_path = '../../upload';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = storage_path;
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

export const checkFileExists = (path: string) => new Promise<void>((resolve, reject) => {
    fs.access(path, fs.constants.F_OK, (err) => {
        if (err) {
            reject();
        } else {
            resolve();
        }
    });
})
