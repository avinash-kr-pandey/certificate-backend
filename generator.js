const express = require('express')
const app = express();
const mongoose = require('mongoose')
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const cors = require('cors')
app.use(express.urlencoded({extended:true}))
app.use(cors())
const fs = require('fs').promises;
const fontkit = require('@pdf-lib/fontkit');
const { Readable } = require('stream');
const QRCode = require('qrcode');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const { fromPath } = require('pdf2pic');

const getFirstPageAsImage = async (pdfBuffer) => {
  const outputDir = path.join(__dirname, 'output_images');
  const outputImagePath = path.join(outputDir, 'certificate_page.1.png');

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Save the PDF buffer to a temporary file
  const tempPdfPath = path.join(outputDir, 'temp.pdf');
  await fs.writeFile(tempPdfPath, pdfBuffer);

  // Set up the conversion options
  const options = {
    density: 100, // Resolution of the image
    saveFilename: 'certificate_page',
    savePath: outputDir,
    format: 'png',
  };

  // Convert the first page
  const storeAsImage = fromPath(tempPdfPath, options);

  // Convert and save the first page as a PNG image
  await storeAsImage(1); // Convert the first page

  // Read the generated image as a buffer
  const imageBuffer = await fs.readFile(outputImagePath);

  // Clean up temporary files
  await fs.unlink(tempPdfPath);
  await fs.unlink(outputImagePath);

  return imageBuffer; // Return the image buffer
};

// Helper function to create a hash (SHA-256)
function cryptoHash(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

async function generateCertificateId(name, selectedCourse) {
  // Helper function to normalize course name
  function getCourseAbbreviation(course) {
    const words = course.trim().split(/\s+/); // Split by spaces
    if (words.length > 1) {
      // Take the first letter of each word if multiple words
      return words.map(word => word[0].toLowerCase()).join('');
    } else {
      // Take the first 3 letters if it's a single word
      return course.substring(0, 3).toLowerCase();
    }
  }

  // Normalize inputs
  const normalizedName = name.trim().replace(/\s+/g, "").toLowerCase();
  const courseAbbreviation = getCourseAbbreviation(selectedCourse);

  // Get the current timestamp
  const timestamp = Date.now();

  // Create a unique hash using the input and timestamp
  const uniqueString = `${normalizedName}${courseAbbreviation}${timestamp}`;
  const hash = cryptoHash(uniqueString).substring(0, 8); // Use the first 8 characters of the hash

  // Combine elements to form the certificate ID
  return `${normalizedName.substring(0, 3)}_${courseAbbreviation}_${hash}`;
}

const savecertificate = async (certificateId, certificateBuffer, fileName) => {
  try {
    const apiUrl = 'https://api.hopingminds.com/api/saveTrainingCertificate'; // API URL to save the file

    const img = await getFirstPageAsImage(certificateBuffer);
    // Prepare the form data to send
    const formData = new FormData();
    formData.append('certificate', img, fileName)
    formData.append('certificateId', certificateId);

    // console.log(certificateBuffer);

    // Make API call to save the file
    const response = await axios.post(apiUrl, formData, {
      headers: {
        'Content-Type': `multipart/form-data;`,
        ...formData.getHeaders(), // Get necessary headers for multipart form
      },
    });

    // Respond with the result from the API
    console.log('File saved successfully!', response.data);
    return { message: 'File saved successfully!', data: response.data };
  } catch (error) {
    console.error('Error saving file:', error.message);
    throw new Error('Error saving file: ' + error.message); // Throw the error to be handled where it's called
  }
}

const generatePDF = async (name, selectedCourse, selectedDate, selectedCertficateTemplate, certificateId) => {
  const certificate1 = await fs.readFile('./cert.pdf');
  const certificate2 = await fs.readFile('./cert2.pdf');
  const certificate3 = await fs.readFile('./cert3.pdf');
  const certificate4 = await fs.readFile('./cert4.pdf');
  const certificate5 = await fs.readFile('./cert5.pdf');
  const certificate6 = await fs.readFile('./cert6.pdf');
  const certificate7 = await fs.readFile('./cert7.pdf');
  const certificate8 = await fs.readFile('./cert8.pdf');
  // 2025 certificate
  const certificate9 = await fs.readFile('./cert1-2025.pdf');
  const certificate10 = await fs.readFile('./cert2-2025.pdf');
  const certificate11 = await fs.readFile('./cert3-2025.pdf');

  let pdfDoc = await PDFDocument.load(certificate11);
  // Load a PDFDocument from the existing PDF bytes

  switch (selectedCertficateTemplate) {
    case 1:
      pdfDoc = await PDFDocument.load(certificate1);
      break;
    case 2:
      pdfDoc = await PDFDocument.load(certificate2);
      break
    case 3:
      pdfDoc = await PDFDocument.load(certificate3);
      break
    case 4:
      pdfDoc = await PDFDocument.load(certificate4);
      break
    case 5:
      pdfDoc = await PDFDocument.load(certificate5);
      break
    case 6:
      pdfDoc = await PDFDocument.load(certificate6);
      break
    case 7:
      pdfDoc = await PDFDocument.load(certificate7);
      break
    case 8:
      pdfDoc = await PDFDocument.load(certificate8);
      break
    default:
      break;
  }

  // Register the standard fonts with the PDFDocument
  pdfDoc.registerFontkit(fontkit);

  // Get the standard font Helvetica
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  //get custom font
  const fontBytes = await fs.readFile('./GoodVibrations Script.ttf');
  const montFont = await fs.readFile('./Montserrat-Medium.ttf');
  const dateBytes = await fs.readFile('./Sanchez-Regular.ttf');
  const gv = await fs.readFile('./GreatVibes-Regular.ttf');
  const colus = await fs.readFile('./Colus-Regular.ttf');

  // Embed our custom font in the document
  const customFont = await pdfDoc.embedFont(fontBytes);
  const customMontFont = await pdfDoc.embedFont(montFont);
  const dateFont = await pdfDoc.embedFont(dateBytes);
  const gvFont = await pdfDoc.embedFont(gv);
  const colusFont = await pdfDoc.embedFont(colus);

  // Get the first page of the document
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const fontSize = 60;
  const textWidth = gvFont.widthOfTextAtSize(name, fontSize);

  // Get the width and height of the first page
  const { width, height } = firstPage.getSize();

  // Calculate the x and y positions to center align the text
  const xPosition = (width - textWidth) / 2;
  const yPosition = height / 4 + 90;

  // Draw the text in the center
  firstPage.drawText(name, {
    x: xPosition,
    y: yPosition + 77,
    size: fontSize,
    font: gvFont,
    color: rgb(0.7450980392156863, 0.5607843137254902, 0.20392156862745098),
  });

  // Manually position the course and date below the name
  const courseFontSize = 20;
  const dateFontSize = 16;
  const courseTextWidth = customMontFont.widthOfTextAtSize(selectedCourse, courseFontSize);
  const courseXPosition = (width - courseTextWidth) / 2;
  const courseYPosition = 207;
  const dateXPosition = 160; // Adjust the x position as needed
  const dateYPosition = 145;

  firstPage.drawText(`${selectedCourse}`, {
    x: courseXPosition,
    y: courseYPosition,
    size: courseFontSize,
    font: customMontFont,
    color: rgb(0.11372549019607843, 0.11372549019607843, 0.10588235294117647),
  });

  // firstPage.drawText(`${selectedDate}`, {
  //   x: dateXPosition,
  //   y: dateYPosition,
  //   size: dateFontSize,
  //   font: dateFont,
  //   color: rgb(0, 0, 0),
  // });

  // Generate a QR code
  const qrData = `https://hopingminds.com/verifiedCertificate?certificateId=${certificateId}`; // Customize this as needed
  const qrCodeOptions = {
    margin: 1, // Minimum margin around the QR code
    width: 300, // QR code size in pixels
  };
  const qrCodeImage = await QRCode.toDataURL(qrData, qrCodeOptions);

  // Embed the QR code image in the PDF
  const qrImageBytes = Buffer.from(qrCodeImage.split(',')[1], 'base64'); // Convert base64 to bytes
  const qrImage = await pdfDoc.embedPng(qrImageBytes);

  // Get original dimensions of the QR code
  const { width: qrOriginalWidth, height: qrOriginalHeight } = qrImage.size();

  // Define cropped dimensions (5px crop on each side)
  const cropPadding = 55;
  const qrCroppedWidth = qrOriginalWidth - cropPadding * 2;
  const qrCroppedHeight = qrOriginalHeight - cropPadding * 2;

  // Define the QR code dimensions and position
  const qrDrawWidth = 100; // Adjust as needed
  const qrDrawHeight = 100; // Adjust as needed
  const qrX = width - qrDrawWidth - 70; // Adjust x position
  const qrY = 102; // Adjust y position

  // Draw the QR code on the page
  firstPage.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrDrawWidth,
    height: qrDrawHeight,
    xScale: qrCroppedWidth / qrOriginalWidth,
    yScale: qrCroppedHeight / qrOriginalHeight,
    xOffset: cropPadding,
    yOffset: cropPadding,

  });
  // Serialize the PDFDocument to bytes (a Uint8Array)
  const pdfBytes = await pdfDoc.save();
  return pdfBytes
  // console.log("Done creating");

  // // Create a Blob and trigger download
  // const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
  // const pdfUrl = URL.createObjectURL(pdfBlob);
  // const link = document.createElement("a");
  // link.href = pdfUrl;
  // link.download = "Certificate.pdf";
  // link.click();
};

  const dataSchema = new mongoose.Schema({
    name: String,
    email: String,
    course: String,
  });

  const Data = mongoose.model('Data', dataSchema);


const certificateDataSchema = new mongoose.Schema({
  certificateId: String,
  name: String,
  email: String,
  course: String,
}, { timestamps: true });

const CertificateData = mongoose.model('CertificateData', certificateDataSchema);

app.post('/auth', async (req, res) => {
  const { name, email, selectedCourse, selectedDate, selectedCertficateTemplate } = req.body;

  console.log(name, email, selectedCourse, selectedDate);
  if (!name || !email || !selectedCourse) {
    return res.send("Please fill all the details");
  }

  const capitalize = (str, lower = false) =>
    (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, (match) =>
      match.toUpperCase()
    );

  const capitalized_name = capitalize(name.trim());
  const trimmed_email = email.trim();
  const trimmed_selectedCourse = selectedCourse.trim();

  try {
    const userFound = await CertificateData.findOne({
      $and: [
        { email: { $regex: new RegExp("^" + email + "$", "i") } },
        { name: { $regex: new RegExp("^" + name + "$", "i") } },
        { course: trimmed_selectedCourse }
      ]
    });

    if (userFound) {
      const certificateId = await generateCertificateId(capitalized_name, selectedCourse);
      const pdfBytes = await generatePDF(capitalized_name, trimmed_selectedCourse, selectedDate, Number(selectedCertficateTemplate), certificateId);

      // Convert Uint8Array to Buffer
      const pdfBuffer = Buffer.from(pdfBytes);

      // Set the response headers to trigger the download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=hopingminds_${capitalized_name}.pdf`);
      const filename = `hopingminds_${capitalized_name}.pdf`;
      const imgbuffer = pdfBuffer;
      savecertificate(certificateId, imgbuffer, filename);
      // return;
      // Send the PDF Buffer as the response
      userFound.certificateId = certificateId;
      await userFound.save();
      res.send(pdfBuffer);
    }

    else {
      const alertScript = `
              <script>
                  alert("User not found. Please provide valid information.");
                  window.history.back();
              </script>
          `;
      res.send(alertScript);
    }



  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error generating certificate");
  }
});


mongoose.connect('mongodb+srv://anuraag:discovery1@cluster0.9thc6oj.mongodb.net/certify?retryWrites=true&w=majority&appName=Cluster0').then(() => {
    console.log("connected")
}).catch((err) => {
    console.log("disconnected", err)
})

app.listen(7009, () => {

    console.log("running")
})

