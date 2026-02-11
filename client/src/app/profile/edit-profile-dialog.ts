import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { UserService } from '../_services/user-service';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-edit-profile-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Edit Profile</h2>
    <mat-dialog-content>
      <div class="form-container">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Display Name (AKA)</mat-label>
          <input matInput [(ngModel)]="displayName" placeholder="Enter your display name" />
        </mat-form-field>

        <div class="section-label">Motto / Bio</div>
        <mat-form-field appearance="outline" class="w-full bio-field">
          <textarea
            matInput
            [(ngModel)]="bio"
            placeholder="Tell us about yourself..."
            rows="2"
            style="line-height: 1.4; resize: none;"
          ></textarea>
        </mat-form-field>

        <div class="section-label">Social & Contacts</div>

        <div class="contact-grid">
          <mat-form-field appearance="outline">
            <mat-label>Instagram</mat-label>
            <input matInput [(ngModel)]="instagram" placeholder="@username" />
            <img matPrefix src="/assets/icons/instagram.avif" class="dialog-icon" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Facebook</mat-label>
            <input matInput [(ngModel)]="facebook" placeholder="Profile name" />
            <img matPrefix src="/assets/icons/facebook.avif" class="dialog-icon" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Discord ID</mat-label>
            <input matInput [(ngModel)]="discordId" placeholder="username#0000" />
            <img matPrefix src="/assets/icons/discord.jpg" class="dialog-icon" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Contact Email</mat-label>
            <input matInput [(ngModel)]="contactEmail" placeholder="your@email.com" />
            <mat-icon matPrefix>alternate_email</mat-icon>
          </mat-form-field>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="!displayName">
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .w-full {
        width: 100%;
      }
      mat-dialog-content {
        min-width: 400px;
        padding-top: 10px;
      }
      .form-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .section-label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--ctp-subtext0);
        letter-spacing: 1px;
        margin: 12px 0 4px 0;
      }
      .contact-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 12px;
      }
      .dialog-icon {
        width: 18px;
        height: 18px;
        margin-right: 8px;
        object-fit: contain;
      }
      .bio-field {
        margin-top: -4px;
        input,
        textarea {
          color: var(--ctp-text) !important;
          font-size: 1rem;
        }
      }
      ::ng-deep .bio-field .mat-mdc-text-field-wrapper {
        min-height: 100px !important;
      }
    `,
  ],
})
export class EditProfileDialog {
  displayName: string = '';
  bio: string = '';
  discordId: string = '';
  instagram: string = '';
  facebook: string = '';
  contactEmail: string = '';

  private _user = inject(UserService);

  constructor(
    public dialogRef: MatDialogRef<EditProfileDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      displayName: string;
      bio?: string;
      discordId?: string;
      instagram?: string;
      facebook?: string;
      contactEmail?: string;
    },
  ) {
    this.displayName = data.displayName;
    this.bio = data.bio || '';
    this.discordId = data.discordId || '';
    this.instagram = data.instagram || '';
    this.facebook = data.facebook || '';
    this.contactEmail = data.contactEmail || '';
  }

  async save() {
    const error = await this._user.updateProfile(
      this.displayName,
      this.bio,
      this.discordId,
      this.contactEmail,
      this.instagram,
      this.facebook,
    );
    if (!error) {
      this.dialogRef.close(true);
    } else {
      console.error(error);
    }
  }
}
