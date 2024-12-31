<template>
  <div class="pdf-viewer" ref="pdf-viewer">
    <!-- <canvas id="pdf-container" ref="pdfCanvas"></canvas> -->
  </div>
</template>

<script>
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb } from 'pdf-lib';
// 设置 PDF.js 的 worker 文件路径
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs';
export default {
  name: "PdfViewer",
  props: {
    pdfUrl: {
      type: String,
      required: true,
      
    },


  },
  mounted() {
    this.loadPdf();
  },
  methods: {
    async loadPdf() {
      const loadingTask = pdfjsLib.getDocument(this.pdfUrl);
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;
      const pdfViewer = this.$refs['pdf-viewer']
      const existingPdfBytes = await fetch(this.pdfUrl).then((res) => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes)

      for(let pageNumber = 1; pageNumber <= totalPages; pageNumber ++) {
        console.log(pageNumber)
        const page = await pdf.getPage(pageNumber);
        
        console.log("######")
        const canvas = document.createElement('canvas');
        pdfViewer.appendChild(canvas)
        const viewport = page.getViewport({ scale: 1 });
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        const textContent = await page.getTextContent();
        const annotations = await page.getAnnotations();
        console.log("anno ==> ", annotations)
        await this.modifyOriginalPdf(pdfDoc, textContent, page, pageNumber)
      }
     
      
      // context.fillStyle = '#FFFFFF'
      // context.fillRect(36, viewport.height - 695.2201 - 11.5,229.128,12)
      // context.fillStyle = '#000000'
      // context.font = "bold 12px sans-serif"
      // context.fillText("123456", 36, viewport.height - 695.2201 - 11.5)
      
      // this.modifyOriginalPdf(textContent, this.pdfUrl, page)

      // const pdfBytes = await pdfDoc1.save();
      // const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      // const url = URL.createObjectURL(blob);

      // const link = document.createElement('a');
      // link.href = url;
      // link.download = 'modified_original.pdf';
      // link.click();
    },

    async modifyOriginalPdf(pdfDoc, translatedData, page, pageNumber) {
      // 获取所有页面
      const pages = pdfDoc.getPages();
      const pageText = translatedData.items.map((item) => item.str).join(" ");
      let fullText = `Page ${pageNumber}:\n${pageText}\n\n`;
      const viewport = page.getViewport({ scale: 1 });
      for (const item of translatedData.items) {
        const pdfPage = pdfDoc.getPage(pageNumber - 1);
        pdfPage.drawRectangle({
          x: item.transform[4],
          y: item.transform[5],
          width: item.width,
          height: item.height,
          color: rgb(1, 1, 1) // 白色
        })
        // 覆盖原文本内容
        pdfPage.drawText(item.str, {
          x: item.transform[4],
          y: item.transform[5],
          size: item.transform[3],
          color: rgb(0, 0, 0), // 黑色文字
        });
        // 绘制翻译后的文本
        // pdfPage.drawText("item tesxtsta", {
        //   x: 36,
        //   y: 695.2201,
        //   size: 12,
        //   color: rgb(0, 0, 0), // 黑色文字
        // });
      }
      const pdfBytes = await pdfDoc.save();
      if(pageNumber == pages.length) {
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'modified_original.pdf';
        link.click();
      }
    }
  }
};
</script>
<style scoped>
.pdf-viewer {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
canvas {
  margin: 10px;
  border: 1px solid #ddd;
}
</style>
