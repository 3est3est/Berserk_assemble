import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { fileTypeFromBlob } from 'file-type';
import { CommonModule } from '@angular/common';

// PrimeNG
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-upload-img',
  standalone: true,
  imports: [ButtonModule, CommonModule],
  templateUrl: './upload-img.html',
  styleUrl: './upload-img.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadImg {
  acceptedMimeType = ['image/jpeg', 'image/png'];
  imgFile: File | undefined;
  imgPreview = signal<string | undefined>(undefined);
  errorMsg = signal<string | undefined>(undefined);
  public readonly _ref = inject(DynamicDialogRef);

  onSubmit() {
    this._ref.close(this.imgFile);
  }

  async onImgPicked(event: Event) {
    this.imgFile = undefined;
    this.imgPreview.set(undefined);
    this.errorMsg.set(undefined);

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imgFile = input.files[0];
      const fileType = await fileTypeFromBlob(this.imgFile);
      if (fileType && this.acceptedMimeType.includes(fileType.mime)) {
        const reader = new FileReader();
        reader.onerror = () => {
          this.imgFile = undefined;
          this.errorMsg.set('some thing went wrong');
        };
        reader.onload = () => {
          this.imgPreview.set(reader.result as string);
        };
        reader.readAsDataURL(this.imgFile);
      } else {
        this.imgFile = undefined;
        this.errorMsg.set('image file must be .jpg or .png');
      }
    }
  }
}
