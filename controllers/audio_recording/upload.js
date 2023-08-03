const uploadRecording = (req, res) => {
    res.json({
        file_name: req.file.filename,
        mimetype: req.file.mimetype,
    });
}

export default uploadRecording
