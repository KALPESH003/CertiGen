const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Helper: Get Base64 Image safely with multiple path checks
 */
const getBase64Image = (filename) => {
    try {
        if (!filename) return null;
        if (filename.startsWith('data:')) return filename;

        const cleanName = filename.startsWith('/') ? filename.slice(1) : filename;
        
        // Define possible paths for the image
        const possiblePaths = [
            path.join(process.cwd(), '../frontend', cleanName),
            path.join(process.cwd(), '../frontend/assets', cleanName),
            path.join(process.cwd(), 'public', cleanName)
        ];

        let filePath = possiblePaths.find(p => fs.existsSync(p));

        if (!filePath) {
            console.error(`⚠️ Image NOT found. Checked:`, possiblePaths);
            return null;
        }

        const bitmap = fs.readFileSync(filePath);
        const base64 = Buffer.from(bitmap).toString('base64');
        const ext = path.extname(filePath).slice(1) || 'png';
        return `data:image/${ext};base64,${base64}`;

    } catch (err) {
        console.error('⚠️ Error reading image file:', err.message);
        return null;
    }
};

const generatePDF = async (certificate, template, qrCodeDataUrl) => {
    let browser;
    try {
        console.log("🔄 Starting PDF Generation...");
        
        // 1. Setup Layout & Defaults
        const layout = template.layout || {};
        const global = layout.global || {};
        const globalTextColor = global.textColor || '#000000';
        const globalAlign = global.textAlign || 'center'; // Default to Center

        // 2. Get Images
        const backgroundData = getBase64Image(template.backgroundUrl);
        
        // Try finding signature with lowercase or capitalized name
        let signatureData = null;
        if (layout.signature) {
             signatureData = getBase64Image('signature.png') || getBase64Image('Signature.png');
        }

        // 3. Launch Browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1123, height: 794 }); // A4 Landscape

        // 4. Dynamic CSS Generator
        const getStyle = (fieldKey) => {
            const field = layout[fieldKey];
            if (!field) return 'display: none;';

            const color = field.color || globalTextColor;
            const fontSize = field.fontSize || 20;
            const align = field.align || globalAlign; // Allow field override

            let style = `
                position: absolute;
                top: ${field.y}px;
                color: ${color};
                font-size: ${fontSize}px;
                font-family: 'Helvetica', 'Arial', sans-serif;
                font-weight: bold;
                z-index: 10;
                line-height: 1.2;
            `;

            // ALIGNMENT FIX:
            // If Center: We set Left: 0 and Width: 100% to force it to page center.
            // If Left: We use the specific X coordinate.
            if (align === 'center') {
                style += `
                    left: 0;
                    width: 100%;
                    text-align: center;
                `;
            } else {
                style += `
                    left: ${field.x}px;
                    text-align: left;
                    transform: translateX(0);
                `;
            }

            return style;
        };

        // 5. Build HTML
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @page { size: A4 landscape; margin: 0; }
                body { 
                    margin: 0; padding: 0; 
                    width: 1123px; height: 794px; 
                    position: relative; 
                    font-family: 'Helvetica', sans-serif;
                    overflow: hidden;
                }
                #bg-img { 
                    position: absolute; top: 0; left: 0; 
                    width: 100%; height: 100%; 
                    z-index: 1; object-fit: cover; 
                }
            </style>
        </head>
        <body>
            ${backgroundData 
                ? `<img id="bg-img" src="${backgroundData}" />` 
                : `<div style="position:absolute; top:0; left:0; width:100%; height:100%; background:#f8fafc;"></div>`
            }

            <div style="${getStyle('recipientName')}">${certificate.recipientName}</div>
            <div style="${getStyle('courseTitle')}">${certificate.courseTitle}</div>
            <div style="${getStyle('description')}">${certificate.description || 'For successfully completing all requirements.'}</div>
            
            <div style="${getStyle('date')}">
                ${layout.date?.label || 'Date: '}${new Date(certificate.issueDate).toLocaleDateString()}
            </div>
            
            <div style="${getStyle('certificateId')}">
                ${layout.certificateId?.label || 'ID: '}${certificate.certificateId}
            </div>
            
            ${layout.qrCode ? `
            <div style="position: absolute; left: ${layout.qrCode.x}px; top: ${layout.qrCode.y}px; width: ${layout.qrCode.size}px; height: ${layout.qrCode.size}px; z-index: 20;">
                <img src="${qrCodeDataUrl}" style="width: 100%; height: 100%;" />
            </div>
            ` : ''}

            ${(layout.signature && signatureData) ? `
            <div style="position: absolute; left: ${layout.signature.x}px; top: ${layout.signature.y}px; width: ${layout.signature.width}px; height: ${layout.signature.height}px; z-index: 20;">
                 <img src="${signatureData}" style="width: 100%; height: 100%; object-fit: contain; display: block; margin: 0 auto;" />
            </div>
            ` : ''}
        </body>
        </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true
        });

        console.log(`✅ PDF Generated (${pdfBuffer.length} bytes)`);
        return pdfBuffer;

    } catch (error) {
        console.error('❌ PDF Generation Error:', error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
};

module.exports = generatePDF;