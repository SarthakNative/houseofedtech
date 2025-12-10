// app/services/cloudinaryService.ts
export class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;

  constructor() {
    this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
    this.uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
  }

  async uploadFile(file: File): Promise<{ url: string; public_id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return {
        url: data.secure_url,
        public_id: data.public_id
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('File upload failed');
    }
  }

  async uploadMultipleFiles(files: File[]): Promise<{ url: string; public_id: string }[]> {
    const uploadPromises = files.map(file => this.uploadFile(file));
    return Promise.all(uploadPromises);
  }
}

export const cloudinaryService = new CloudinaryService();