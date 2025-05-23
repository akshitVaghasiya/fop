import { Inject, Injectable } from '@nestjs/common';
import { v2 as Cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private cloudinary: typeof Cloudinary) { }

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    try {
      return await new Promise((resolve, reject) => {
        this.cloudinary.uploader
          .upload_stream(
            {
              folder,
              resource_type: 'auto',
              use_filename: true,
              unique_filename: true,
            },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error.message);
                return reject(
                  new Error('Image upload failed. Please try again.'),
                );
              }
              if (!result) {
                console.error('Cloudinary upload returned no result.');
                return reject(
                  new Error(
                    'Upload failed: No result returned from Cloudinary.',
                  ),
                );
              }
              resolve(result);
            },
          )
          .end(file.buffer);
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Unexpected upload error:', error.message);
      } else {
        console.error('Unexpected upload error occurred:', error);
      }
      throw new Error('Unexpected error occurred while uploading the image.');
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await this.cloudinary.uploader.destroy(publicId, {
        invalidate: true,
        resource_type: 'image',
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to delete image:', error.message);
      }
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  extractPublicIdFromUrl(url: string): string {
    const matches = url.match(/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
    if (!matches?.[1]) {
      throw new Error(`Invalid Cloudinary URL: ${url}`);
    }
    return matches[1];
  }
}
