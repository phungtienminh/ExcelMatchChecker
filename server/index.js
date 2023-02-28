require('dotenv').config();
const ExcelJS = require('exceljs'); // B3 - S131, B3 - G130
const workbook = new ExcelJS.Workbook();

const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
app.use(fileUpload({
    limits: {
        fileSize: 1 * 1024 * 1024
    }
}));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
})

app.get('/', (req, res) => {
    // Foo - for testing
    console.log('Worked!');
});

app.post('/upload', async (req, res) => {
    if (req.files === null) {
        return res.status(400).json({msg: 'No file uploaded'});
    }

    const uploadedFile = req.files.file;
    if (!uploadedFile.name.endsWith('.xls') && !uploadedFile.name.endsWith('.xlsx')) {
        return res.status(400).json({msg: 'Invalid file type'});
    }

    if (uploadedFile.truncated) {
        return res.status(400).json({msg: 'File size limit exceeded'});
    }

    const clientWorkbook = new ExcelJS.Workbook();
    await clientWorkbook.xlsx.load(uploadedFile.data);

    const colnames = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];
    let messages = [];

    const truthDNTD = workbook.getWorksheet('Dư nợ tín dụng');
    const truthTPTTT = workbook.getWorksheet('Tổng phương tiện thanh toán');
    const clientDNTD = clientWorkbook.getWorksheet('Dư nợ tín dụng');
    const clientTPTTT = clientWorkbook.getWorksheet('Tổng phương tiện thanh toán');

    if (typeof truthDNTD === 'undefined' || truthDNTD === null) {
        return res.status(500).json({msg: 'Internal server error'});
    }
    if (typeof truthTPTTT === 'undefined' || truthTPTTT === null) {
        return res.status(500).json({msg: 'Internal server error'});
    }
    if (typeof clientDNTD === 'undefined' || clientDNTD === null) {
        messages.push({type: 'Failure', content: 'Không tìm thấy sheet Dư nợ tín dụng'});
        return res.status(200).json({msg: messages});
    }
    if (typeof clientTPTTT === 'undefined' || clientDNTD === null) {
        messages.push({type: 'Failure', content: 'Không tìm thấy sheet Tổng phương tiện thanh toán'});
        return res.status(200).json({msg: messages});
    }

    for (let col of colnames) {
        for (let row = 3; row <= 131; row++) {
            const truthData = truthDNTD.getCell(`${col}${row}`).value;
            const clientData = clientDNTD.getCell(`${col}${row}`).value;
            if (truthData !== clientData) {
                messages.push({type: 'Failure', content: `Dư nợ tín dụng!${col}${row}: Found ${clientData}, expected ${truthData}`});
            }
        }
    }

    for (let col of colnames.slice(0, colnames.indexOf('H'))) {
        for (let row = 3; row <= 130; row++) {
            const truthData = truthTPTTT.getCell(`${col}${row}`).value;
            const clientData = clientTPTTT.getCell(`${col}${row}`).value;
            if (truthData !== clientData) {
                messages.push({type: 'Failure', content: `Tổng phương tiện thanh toán!${col}${row}: Found ${clientData}, expected ${truthData}`});
            }
        }
    }

    if (messages.length === 0) {
        messages.push({type: 'Success', content: 'Your sheet matched author\'s sheet!'});
    } else if (messages.length > 5) {
        messages = messages.slice(0, 5);
    }

    return res.status(200).json({msg: messages});
});

app.listen(PORT, async (req, res) => {
    await workbook.xlsx.readFile('data.xlsx');
    console.log('Listening...');
});