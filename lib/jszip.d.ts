declare module '@/lib/jszip' {
  class JSZip {
    constructor();
    file(name: string, data: any, options?: any): this;
    folder(name: string): JSZip;
    generateAsync(options: { type: 'blob' | 'base64' | 'string' | 'arraybuffer' | 'uint8array' }): Promise<Blob>;
  }
  const defaultExport: typeof JSZip;
  export default defaultExport;
}
