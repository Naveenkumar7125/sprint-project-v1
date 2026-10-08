import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadProgress {
  state: 'PENDING' | 'UPLOADING' | 'DONE' | 'ERROR';
  progress: number;
  url?: string;
  publicId?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private readonly cloudName = environment.cloudinary.cloudName;
  private readonly uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

  constructor(private http: HttpClient) {}

  uploadImage(file: File, folder: string = 'eshopping-zone/products'): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', environment.cloudinary.uploadPreset || 'ml_default');
    formData.append('folder', folder);

    const req = new HttpRequest('POST', this.uploadUrl, formData, {
      reportProgress: true
    });

    return this.http.request<any>(req).pipe(
      map((event: HttpEvent<any>): UploadProgress => {
        switch (event.type) {
          case HttpEventType.Sent:
            return { state: 'UPLOADING', progress: 0 };
          case HttpEventType.UploadProgress:
            const percent = event.total ? Math.round((100 * event.loaded) / event.total) : 50;
            return { state: 'UPLOADING', progress: percent };
          case HttpEventType.Response:
            const res = event.body;
            return {
              state: 'DONE',
              progress: 100,
              url: res?.secure_url || res?.url,
              publicId: res?.public_id
            };
          default:
            return { state: 'PENDING', progress: 0 };
        }
      })
    );
  }

  getOptimizedUrl(url: string | undefined, width: number = 400, height: number = 400): string {
    if (!url) return '/assets/images/placeholder.png';
    if (!url.includes('cloudinary.com')) return url;

    // Inject Cloudinary transformations (auto format, auto quality, crop fill)
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return url;

    const prefix = url.substring(0, uploadIndex + 8);
    const suffix = url.substring(uploadIndex + 8);
    const transform = `c_fill,w_${width},h_${height},q_auto,f_auto/`;
    return prefix + transform + suffix;
  }
}
