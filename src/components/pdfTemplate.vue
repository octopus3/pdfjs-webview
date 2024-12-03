<template>
  <div class="pdf-viewer">
    <canvas id="pdf-container" ref="pdfCanvas"></canvas>
  </div>
</template>

<script>
import * as pdfjsLib from "pdfjs-dist";
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
      const viewport = page.getViewport({ scale: 1.5 });
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
    },
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
