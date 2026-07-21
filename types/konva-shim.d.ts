declare module 'react-konva' {
  export const Stage: any;
  export const Layer: any;
  export const Rect: any;
  export const Text: any;
  export const Image: any;
  export const Transformer: any;
  export const Group: any;
}

declare module 'use-image' {
  export default function useImage(url: string, crossOrigin?: string): [any, string];
}
