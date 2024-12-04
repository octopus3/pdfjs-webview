<template>
  <div class="pdf-viewer">
    <canvas id="pdf-container" ref="pdfCanvas"></canvas>
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
      const page = await pdf.getPage(2);
      const viewport = page.getViewport({ scale: 1 });
      const canvas = this.$refs.pdfCanvas;
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      await page.render(renderContext).promise;
      const textContent = await page.getTextContent();
      
      console.log("textContent ==> ", textContent)
      const pageText = textContent.items.map((item) => item.str).join(" ");
      let fullText = `Page ${1}:\n${pageText}\n\n`;

      console.log(`Extracted text from page ${1}`);
      console.log("fullText ==> ", fullText)
      context.fillStyle = '#FFFFFF'
      context.fillRect(36, viewport.height - 695.2201 - 11.5,229.128,12)
      context.fillStyle = '#000000'
      context.font = "bold 12px sans-serif"
      context.fillText("123456", 36, viewport.height - 695.2201 - 11.5)
      console.log("drawRect")
      this.modifyOriginalPdf(textContent, this.pdfUrl, page)
    },

    async modifyOriginalPdf(translatedData, originalPdfUrl, page) {
      const existingPdfBytes = await fetch(originalPdfUrl).then((res) => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes)
      const viewport = page.getViewport({ scale: 1 });
      for (const item of translatedData.items) {
        console.log("item ==> ", item, viewport.height)
        const pdfPage = pdfDoc.getPage(1);

      //   // 覆盖原文本内容
        // 绘制翻译后的文本
        pdfPage.drawText("item.text???", {
          x: 36,
          y: 695.2201,
          size: 12,
          color: rgb(0, 0, 0), // 黑色文字
        });
      }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'modified_original.pdf';
        link.click();
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
