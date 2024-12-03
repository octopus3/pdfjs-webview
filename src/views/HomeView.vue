<template>
  <div>
    <PdfViewer pdfUrl="/demo-annotated.pdf" />
  </div>
</template>

<script>
import PdfViewer from '@/components/pdfTemplate.vue';

export default {
  name: 'App',
  components: {
    PdfViewer
  }
};
</script>
