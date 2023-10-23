const Tesseract = require('tesseract.js');

export default async function (req: any, res: any) {
    const imgBase64: string = req.body.data;
    console.log("\n\n\n\nReceived the requestions--->",!!imgBase64)
    const imageBuffer: Buffer = Buffer.from(imgBase64, "base64");
  
    try {
      const { data: { text } } = await Tesseract.recognize(
        imageBuffer,
        'eng',
        { logger: (info: any) => console.log(info) }
      );
  
      console.log('OCR Result:', text);
      res.send(text);
    } catch (error) {
      console.error('Error during OCR:', error);
    }
  }
  