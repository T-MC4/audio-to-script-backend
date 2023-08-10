export enum TranscriptSource {
    audioToScript = 'file-upload',
    copyPasteToScript = 'paste-script'
}

export const aiModelNameMap = {
    [TranscriptSource.audioToScript]: 'gpt-4-32k-0314',
    [TranscriptSource.copyPasteToScript]: 'gpt-4-32k-0613',
} as const
