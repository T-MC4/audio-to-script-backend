export const transcriptSources = {
    audioToScript: 'audio-to-script',
    copyPasteToScript: 'copy-paste-to-script'
}

export const flows = {
    salesAdvanced: 'sales-advanced',
    customerServiceAdvanced: 'customer-service-advanced',
    standardScriptOnly: 'standard-script-only',
}

export const aiModelNameMap = {
    [transcriptSources.audioToScript]: 'gpt-4-32k-0314',
    [transcriptSources.copyPasteToScript]: 'gpt-4-32k-0613',
}
