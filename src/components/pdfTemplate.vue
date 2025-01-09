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
    canDownload: {
      type: Boolean,
      default: true
    },
    ratio: {
      type: Number,
      default: 1
    },
    debugFont: {
      type: Boolean,
      default: false
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

      for(let pageNumber = 1; pageNumber <= totalPages; pageNumber += 2) {
        console.log(pageNumber)
        
        
        const spread = document.createElement('div')
        // 在渲染页数的同时右边也继续渲染
        spread.classList.add('spread')
        await this.renderPage(pdf, pdfDoc, pageNumber, spread, false);
        await this.renderPage(pdf, pdfDoc, pageNumber, spread, true);
        if (pageNumber + 1 <= totalPages) {
          await this.renderPage(pdf, pdfDoc, pageNumber + 1, spread, false);
          await this.renderPage(pdf, pdfDoc, pageNumber + 1, spread, true);
        }
        pdfViewer.appendChild(spread)
      }
    },

    async renderPage(pdf, pdfDoc, pageNumber, spread, isRight) {
      const page = await pdf.getPage(pageNumber);
      const canvas = document.createElement('canvas');
      const canvasContainer = document.createElement('div')
      const pageContainer = document.createElement('div')
      canvasContainer.classList.add("canvas-wrapper")
        pageContainer.classList.add('page-container')
        canvasContainer.appendChild(canvas)
        pageContainer.appendChild(canvasContainer)
        spread.appendChild(pageContainer)
        
        // pdfViewer.appendChild(spread)
        const viewport = page.getViewport({ scale: this.ratio });
        const context = canvas.getContext("2d");
        // 设置canvas
        canvas.height = this.ratio * viewport.height;
        canvas.width = this.ratio * viewport.width;
        // canvasRight.height = viewport.height
        // canvasRight.width = viewport.width
        canvas.id =  'canvas-left-' + pageNumber
        // canvasRight.id = 'canvas-right-' + pageNumber
        // end
        // 创建文本画板
        const textLayer = document.createElement("div")
        textLayer.style.width = viewport.width + 'px'
        textLayer.style.height = viewport.height + 'px'
        textLayer.style.top = 0 + 'px'
        // textLayer.style.top = ((pageNumber - 1) * viewport.height + pageNumber * 10 + (pageNumber - 1) ) + 'px'
        textLayer.classList.add("text-layer")
        pageContainer.appendChild(textLayer)
        // end
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        await page.render(renderContext).promise;
        // 如果属于右边的元素就给对应位置涂白
        if(isRight) {
          
        }
        // end
        const textContent = await page.getTextContent();
        const annotations = await page.getAnnotations();
        const operatorObj = await page.getOperatorList()
        console.log("textContent ==> ", textContent)
        console.log("anno ==> ", annotations)
        console.log("operatorList ==> ", operatorObj)

        await this.modifyOriginalPdf(pdfDoc, textContent, operatorObj, page, pageNumber, textLayer)
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
        span.style.color = this.debugFont ? '#000000' : 'transparent'
        span.style.cursor = 'text'
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
        link.innerText = "download"
        link.download = 'modified_original.pdf';
        // pdfViewer.appendChild(link)
        // link.click();
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
      opacity: .25;
      &::selection {
        background: blue;
        background: AccentColor;
      }
      & span::selection {
        color: transparent;
        background: blue;
      }
    }
    
  }
.canvas-wrapper {
  font-size: 0;
}
.page-container {
  margin: 1px auto -8px;
  border: 9px solid transparent;
  position: relative;
  display: inline-block;
  vertical-align: middle;
}
.spread {
 text-align: center;
 white-space: normal;
}
</style>
