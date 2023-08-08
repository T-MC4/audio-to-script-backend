export enum TranscriptSource {
    audioToScript = 'audio-to-script',
    copyPasteToScript = 'copy-paste-to-script'
}

export enum Flow {
    salesAdvanced = 'sales-advanced',
    customerServiceAdvanced = 'customer-service-advanced',
    standardScriptOnly = 'standard-script-only',
}

export const aiModelNameMap = {
    [TranscriptSource.audioToScript]: 'gpt-4-32k-0314',
    [TranscriptSource.copyPasteToScript]: 'gpt-4-32k-0613',
} as const
