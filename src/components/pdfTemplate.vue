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
    canDownload: false,
    ratio: {
      type: Number,
      default: 1
    }
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
        const viewport = page.getViewport({ scale: this.ratio });
        const context = canvas.getContext("2d");
        const textLayer = document.createElement("div")
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        textLayer.style.width = viewport.width + 'px'
        textLayer.style.height = viewport.height + 'px'
        textLayer.style.top = (pageNumber - 1) * viewport.height + 'px'
        textLayer.classList.add("text-layer")
        pdfViewer.appendChild(textLayer)
        console.log("viewport ==> ", viewport)
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        console.log("viewport ==> ", viewport)
        await page.render(renderContext).promise;
        const textContent = await page.getTextContent();
        const annotations = await page.getAnnotations();
        const operatorObj = await page.getOperatorList()
        console.log("textContent ==> ", textContent)
        console.log("anno ==> ", annotations)
        console.log("operatorList ==> ", operatorObj)
        
        
        await this.modifyOriginalPdf(pdfDoc, textContent, operatorObj, page, pageNumber, textLayer)
      }
    },

    async modifyOriginalPdf(pdfDoc, translatedData, operatorObj, page, pageNumber, textLayer) {
      // 获取所有页面
      const pages = pdfDoc.getPages();
      const pageText = translatedData.items.map((item) => item.str).join(" ");
      let fullText = `Page ${pageNumber}:\n${pageText}\n\n`;
      const viewport = page.getViewport({ scale: 1 });
      const pdfViewer = this.$refs['pdf-viewer']
      for (const item of translatedData.items) {
        const pdfPage = pdfDoc.getPage(pageNumber - 1);
        const fontStyle = translatedData.styles[item.fontName]
        const span = document.createElement('span');
        span.classList.add('pdf-text');
        span.textContent = item.str;
        const pdfHeight = viewport.height;
        const baselineTop = item.height * fontStyle.ascent;
        const totalHeight = item.height * (fontStyle.ascent - fontStyle.descent);
        // 设置位置
        const x = item.transform[4]; // X坐标
        const y = item.transform[5]; // Y坐标
        const fontSize = item.transform[0]
        span.style.position = 'absolute'
        span.style.left = `${x}px`;
        span.style.top = `${viewport.height - y - baselineTop}px`; // 减去字体大小来匹配 PDF 坐标系
        span.style.fontSize = `${fontSize}px`;
        span.style.fontFamily = fontStyle.fontFamily
        span.style.lineHeight = `${totalHeight}px`;
        span.style.height = `${totalHeight}px`;
        // const graphicState = {}; // 存储图形状态
        // operatorObj.fnArray.forEach((fn, i) => {
        //   const args = operatorObj.argsArray[i];
        //   if (fn === pdfjsLib.OPS.setFillRGBColor) {
        //     graphicState.fillColor = args; // 填充颜色 RGB 值
        //   }
        //   if (fn === pdfjsLib.OPS.showText) {
        //     const text = args[0].str;
        //     span.style.color = 'rgb(' + graphicState.fillColor +')'
        //     console.log(`Text: ${text}, Fill Color: ${graphicState.fillColor}`);
        //   }
        // });
        textLayer.appendChild(span)
       
        // 添加到容器中
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
      }
      const pdfBytes = await pdfDoc.save();
      if(pageNumber == pages.length && this.canDownload) {
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
<style lang="scss">
  .pdf-viewer {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    position: relative;
    .text-layer {
      position: absolute;
    }
  }
canvas {
}
</style>
