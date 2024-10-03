const fs = require('fs');
const path = require('path');
const exceljs = require('exceljs');
const js2xmlparser = require('js2xmlparser');
const yaml = require('js-yaml');


// ฟังก์ชันเพื่อแปลงข้อมูล log เป็น CSV
const convertLogsToCSV = (logData) => {
    const logs = logData.trim().split('\n').map(log => {
        const [timestamp, level, message] = log.split(/ (.+)/);
        return { timestamp, level, message };
    });

    const headers = ['Timestamp', 'Level', 'Message'];
    const csvData = [
        headers.join(','), // หัวข้อของ CSV
        ...logs.map(log => `${log.timestamp},${log.level},${log.message}`)
    ].join('\n');

    return csvData;
};


const logFilePath = path.join(__dirname, '..', 'logs', 'app.log');

const logs = (req, res, callback) => {
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading logs file' });
        }

        // Split the data into lines and filter out empty lines
        const lines = data.split('\n').filter(line => line.trim() !== '');

        // Create an array to hold log entries
        const logEntries = lines.map((line, index) => ({ lineNumber: index + 1, lineContent: line }));

        // Log the lines for debugging
        // console.log('Log Entries:', logEntries);

        // If a callback is provided, call it with the log entries
        if (callback) {
            callback({ logs: logEntries });
        } else {
            res.json({ logs: logEntries });
        }
    });
};

const exportLogs = (req, res) => {
    const typeFile = req.query.value;
    if (typeFile === "csv") {
        fs.readFile(logFilePath, 'utf8', (err, data) => {

            if (err) {
                console.error('Error reading log file:', err);
                return res.status(500).json({ message: 'Internal Server Error' });
            }

            const csvData = convertLogsToCSV(data);
            const csvFilePath = path.join(__dirname, '../logs.csv');

            fs.writeFile(csvFilePath, csvData, (err) => {
                if (err) {
                    console.error('Error writing CSV file:', err);
                    return res.status(500).json({ message: 'Internal Server Error' });
                }

                res.download(csvFilePath, 'logs.csv', (err) => {
                    if (err) {
                        console.error('Error sending CSV file:', err);
                        return res.status(500).json({ message: 'Internal Server Error' });
                    }

                    // ลบไฟล์ CSV หลังจากส่งเสร็จแล้ว (ไม่บังคับ)
                    fs.unlink(csvFilePath, (err) => {
                        if (err) {
                            console.error('Error deleting CSV file:', err);
                        }
                    });
                });
            });
        });
    } else if (typeFile == 'excel') {
        fs.readFile(logFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading log file:', err);
                return res.status(500).json({ message: 'Internal Server Error' });
            }

            const logs = data.split('\n').map(line => line.split(','));
            const workbook = new exceljs.Workbook();
            const worksheet = workbook.addWorksheet('Logs');

            logs.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    worksheet.getCell(rowIndex + 1, colIndex + 1).value = cell;
                });
            });

            const excelFilePath = path.join(__dirname, '../logs.xlsx');
            workbook.xlsx.writeFile(excelFilePath)
                .then(() => {
                    res.download(excelFilePath, 'logs.xlsx', (err) => {
                        if (err) {
                            console.error('Error sending Excel file:', err);
                            return res.status(500).json({ message: 'Internal Server Error' });
                        }

                        // ลบไฟล์ Excel หลังจากส่งเสร็จแล้ว (ไม่บังคับ)
                        fs.unlink(excelFilePath, (err) => {
                            if (err) {
                                console.error('Error deleting Excel file:', err);
                            }
                        });
                    });
                })
                .catch(err => {
                    console.error('Error writing Excel file:', err);
                    return res.status(500).json({ message: 'Internal Server Error' });
                });
        });
    } else if (typeFile === 'xml') {
        // Read app.log file
        fs.readFile(logFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading log file:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            // Split logs by new line and create an array
            const logsArray = data.split('\n');
            // Convert logs array to XML
            const xml = js2xmlparser.parse('logs', logsArray);
            // Send logs as XML
            res.set({
                'Content-Disposition': 'attachment; filename="logs.xml"',
                'Content-Type': 'application/xml'
            });
            res.send(xml);
        });
    } else if (typeFile === 'yaml') {
        // Read app.log file
        fs.readFile(logFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading log file:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            // Split logs by new line and create an array
            const logsArray = data.split('\n');
            // Convert logs array to YAML
            const yamlText = yaml.dump(logsArray);
            // Send logs as YAML
            res.set({
                'Content-Disposition': 'attachment; filename="logs.yaml"',
                'Content-Type': 'text/yaml'
            });
            res.send(yamlText);
        });
    } else if (typeFile === 'plain') {
        // Read app.log file and send it as plain text
        res.set({
            'Content-Disposition': 'attachment; filename="app.log"',
            'Content-Type': 'text/plain'
        });
        fs.createReadStream(logFilePath).pipe(res);

    } else if (typeFile === 'json') {
        // Read app.log file
        fs.readFile(logFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading log file:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            // Split logs by new line and create an array
            const logsArray = data.split('\n');
            // Create JSON object
            const logsJSON = logsArray.map((log, index) => ({
                id: index + 1,
                message: log.trim()
            }));
            // Send logs as JSON
            res.set({
                'Content-Disposition': 'attachment; filename="logs.json"',
                'Content-Type': 'application/json'
            });
            res.send(JSON.stringify(logsJSON, null, 2));
        });

    } else {
        res.status(400).json({ error: 'Invalid export format' });
    }

};

module.exports = {
    logs,
    exportLogs
};
