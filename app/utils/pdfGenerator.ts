// app/utils/pdfGenerator.ts
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generateTransferPDF = (transfers: any[], evidenceImageUrl: string) => {
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
        image: evidenceImageUrl,
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
    }
  };

  pdfMake.createPdf(docDefinition).open();
};