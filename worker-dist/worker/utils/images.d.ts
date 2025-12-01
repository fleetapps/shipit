import { ImageAttachment, ProcessedImageAttachment } from "../types/image-attachment";
export declare function base64ToUint8Array(base64: string): Uint8Array;
export declare enum ImageType {
    SCREENSHOTS = "screenshots",
    UPLOADS = "uploads"
}
export declare function uploadImageToCloudflareImages(env: Env, image: ImageAttachment, type: ImageType, bytes?: Uint8Array): Promise<string>;
export declare function getPublicUrlForR2Image(env: Env, r2Key: string): string;
export declare function uploadImageToR2(env: Env, image: ImageAttachment, type: ImageType, cfImagesUrl?: string, bytes?: Uint8Array): Promise<{
    url: string;
    r2Key: string;
}>;
export declare function uploadImage(env: Env, image: ImageAttachment, type: ImageType): Promise<ProcessedImageAttachment>;
export declare function hashImageB64url(dataUrl: string): Promise<string>;
export declare function imageToBase64(env: Env, image: ProcessedImageAttachment): Promise<string>;
export declare function imagesToBase64(env: Env, images: ProcessedImageAttachment[]): Promise<string[]>;
export declare function downloadR2Image(env: Env, r2Key: string): Promise<ProcessedImageAttachment>;
