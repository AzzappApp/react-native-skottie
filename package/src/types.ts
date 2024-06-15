import type {
  SkCanvas,
  SkJSIInstance,
  SkRect,
  SkImage,
  SkMatrix,
  FilterMode,
  MipmapMode,
} from '@shopify/react-native-skia';

/**
 * Serialized animation as generated from After Effects
 */
export interface AnimationObject {
  v: string;
  fr: number;
  ip: number;
  op: number;
  w: number;
  h: number;
  nm?: string;
  ddd?: number;
  assets: any[];
  layers: any[];
  markers?: any[];
}

export const enum SizeFit {
  Fill,
  Start,
  Center,
  End,
  // No scaling.
  None,
}

export interface FrameData {
  image: SkImage;
  filterMode: FilterMode;
  mipMapMode: MipmapMode;
  matrix: SkMatrix;
  sizeFit: SizeFit;
}

export interface ImageAsset {
  isMultiFrame(): boolean;
  getFrameData(time: number): FrameData;
}

export interface ResourceProvider {
  loadImageAsset(
    resourcePath: string,
    resourceName: string,
    resourceId: string
  ): ImageAsset | null;
}

export interface SkSkottie extends SkJSIInstance<'Skottie'> {
  duration: number;
  fps: number;
  render: (canvas: SkCanvas, rect: SkRect) => void;
  seek: (progress: number) => void;
}

export type SkottieViewSource = number | string | AnimationObject | SkSkottie;
