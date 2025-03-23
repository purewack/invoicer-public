<script setup lang="ts">
import { InvoiceController } from '@shared/api';

const props = defineProps<{invoiceID: string}>()

async function savePDF(){
    const res = await InvoiceController.generatePdfData(props.invoiceID)
    const data = new Uint8Array(res.content.data)
    console.log(data)
    const blob = new Blob([data], {type: res.contentType})
    console.log(blob)
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', res.filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

</script>

<template>
    <v-btn @click="savePDF" color="primary" variant="tonal">
        <v-icon>mdi-download</v-icon>
        PDF
    </v-btn>
</template>