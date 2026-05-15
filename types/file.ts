export type UploadedFile = {
  id?: string;

  name: string;

  url: string;

  type?: string;

  size?: number;

  extractedText?: string;

  uploadedAt?: number;
};