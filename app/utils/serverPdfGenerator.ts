import * as fs from 'fs-extra';
import * as path from 'path';
import pdfMake from 'pdfmake/build/pdfmake';
import { TDocumentDefinitions, StyleDictionary } from 'pdfmake/interfaces';
import fetch from 'node-fetch';

interface ITransferItem {
    productId: string;
    productName: string;
    productCode: string;
    boxCode: string;
    fromLocation: string;
    toLocation: string;
    quantity: number;
}

const pdfFonts = require('pdfmake/build/vfs_fonts');

const robotoRegular = fs.readFileSync(path.join(process.cwd(), 'fonts', 'Roboto-Regular.ttf'));
const robotoMedium = fs.readFileSync(path.join(process.cwd(), 'fonts', 'Roboto-Medium.ttf'));
const robotoItalic = fs.readFileSync(path.join(process.cwd(), 'fonts', 'Roboto-Italic.ttf'));
const robotoMediumItalic = fs.readFileSync(path.join(process.cwd(), 'fonts', 'Roboto-MediumItalic.ttf'));

pdfMake.vfs = {
    ...pdfFonts.pdfMake.vfs,
    'Roboto-Regular.ttf': robotoRegular,
    'Roboto-Medium.ttf': robotoMedium,
    'Roboto-Italic.ttf': robotoItalic,
    'Roboto-MediumItalic.ttf': robotoMediumItalic
};

pdfMake.fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    }
};

async function getImageDataUrl(url: string): Promise<string> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type');
    return `data:${mimeType};base64,${base64}`;
}

export async function generateTransferPDF(transfers: ITransferItem[], evidenceImageUrl: string): Promise<string> {
  const tableBody = [
    ['Producto', 'Desde', 'Hacia', 'Cantidad']
  ];

  transfers.forEach(transfer => {
    tableBody.push([
      transfer.productName,
      transfer.fromLocation,
      transfer.toLocation,
      transfer.quantity.toString()
    ]);
  });

  const imageDataUrl = await getImageDataUrl(evidenceImageUrl);

  const docDefinition: TDocumentDefinitions = {
    content: [
      { text: 'Detalle de Transferencia', style: 'header' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*', '*'],
          body: tableBody
        }
      },
      { text: 'Evidencia:', style: 'subheader' },
      {
        image: imageDataUrl,
        width: 500
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5]
      }
    } as StyleDictionary
  };

  const pdfDoc = pdfMake.createPdf(docDefinition);
  
  return new Promise((resolve, reject) => {
    pdfDoc.getBuffer((buffer) => {
      const fileName = `transfer_${Date.now()}.pdf`;
      const filePath = path.join(process.cwd(), 'public', 'pdfs', fileName);
      
      fs.ensureDirSync(path.dirname(filePath));
      fs.writeFileSync(filePath, buffer);
      
      resolve(`/pdfs/${fileName}`);
    });
  });
}