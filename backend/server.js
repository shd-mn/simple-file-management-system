const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        // Ensure unique filenames by appending timestamp if file exists
        const uniqueFilename = `${path.parse(file.originalname).name}_${Date.now()}${path.parse(file.originalname).ext}`;
        cb(null, uniqueFilename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Get all files with optional search and sort
app.get('/api/files', async (req, res) => {
    try {
        const { search, sortBy, sortOrder } = req.query;
        const files = await fs.readdir(uploadsDir);
        const fileStats = await Promise.all(
            files.map(async (file) => {
                const stats = await fs.stat(path.join(uploadsDir, file));
                return {
                    name: file,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime
                };
            })
        );

        // Filter files if search query exists
        let filteredFiles = fileStats;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredFiles = fileStats.filter(file => 
                file.name.toLowerCase().includes(searchLower)
            );
        }

        // Sort files if sortBy parameter exists
        if (sortBy && ['name', 'size', 'createdAt', 'modifiedAt'].includes(sortBy)) {
            filteredFiles.sort((a, b) => {
                const order = sortOrder === 'desc' ? -1 : 1;
                if (sortBy === 'name') {
                    return order * a.name.localeCompare(b.name);
                }
                return order * (a[sortBy] - b[sortBy]);
            });
        }

        res.json(filteredFiles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload file
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ 
        message: 'File uploaded successfully',
        file: {
            name: req.file.filename,
            size: req.file.size,
            path: req.file.path
        }
    });
});

// Delete file
app.delete('/api/files/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filepath = path.join(uploadsDir, filename);
        
        // Check if file exists
        await fs.access(filepath);
        await fs.unlink(filepath);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'File not found' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Rename file
app.put('/api/files/:filename/rename', async (req, res) => {
    try {
        const oldFilename = req.params.filename;
        const { newFilename } = req.body;

        if (!newFilename) {
            return res.status(400).json({ error: 'New filename is required' });
        }

        const oldPath = path.join(uploadsDir, oldFilename);
        const newPath = path.join(uploadsDir, newFilename);

        // Check if old file exists
        await fs.access(oldPath);
        
        // Check if new filename already exists
        try {
            await fs.access(newPath);
            return res.status(400).json({ error: 'A file with this name already exists' });
        } catch {
            // This is good - means the new filename is available
        }

        await fs.rename(oldPath, newPath);
        res.json({ 
            message: 'File renamed successfully',
            oldName: oldFilename,
            newName: newFilename
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'File not found' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Get local directory files
app.get('/api/local-files', async (req, res) => {
    try {
        const directoryPath = req.query.path;
        if (!directoryPath) {
            return res.status(400).json({ error: 'Directory path is required' });
        }

        const files = await fs.readdir(directoryPath);
        const fileStats = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(directoryPath, file);
                const stats = await fs.stat(filePath);
                return {
                    name: file,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    modifiedAt: stats.mtime,
                    path: filePath
                };
            })
        );
        res.json(fileStats);
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'Directory not found' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Delete local file
app.delete('/api/local-files', async (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) {
            return res.status(400).json({ error: 'File path is required' });
        }

        await fs.access(filePath);
        await fs.unlink(filePath);
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'File not found' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Rename local file
app.put('/api/local-files', async (req, res) => {
    try {
        const { oldPath, newName } = req.body;
        if (!oldPath || !newName) {
            return res.status(400).json({ error: 'Old path and new name are required' });
        }

        const dirPath = path.dirname(oldPath);
        const newPath = path.join(dirPath, newName);

        // Check if old file exists
        await fs.access(oldPath);
        
        // Check if new filename already exists
        try {
            await fs.access(newPath);
            return res.status(400).json({ error: 'A file with this name already exists' });
        } catch {
            // This is good - means the new filename is available
        }

        await fs.rename(oldPath, newPath);
        res.json({ 
            message: 'File renamed successfully',
            oldPath,
            newPath
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'File not found' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
