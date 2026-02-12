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
          <textarea matInput [(ngModel)]="bio" placeholder="Tell us about yourself..."></textarea>
        </mat-form-field>

        <div class="section-label">Social & Contacts</div>

        <div class="contact-grid">
          <mat-form-field appearance="outline">
            <mat-label>Instagram</mat-label>
            <input matInput [(ngModel)]="instagram" placeholder="@username" />
            <img matPrefix src="/assets/icons/instagram.jpg" class="dialog-icon" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Facebook</mat-label>
            <input matInput [(ngModel)]="facebook" placeholder="Profile name" />
            <img matPrefix src="/assets/icons/facebook.png" class="dialog-icon" />
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
    <mat-dialog-actions>
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button class="save-btn" (click)="save()" [disabled]="!displayName">
        Save Changes
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .w-full {
        width: 100%;
      }
      mat-dialog-content {
        min-width: 440px;
        padding-top: 10px !important;
      }
      .form-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 4px;
      }
      .section-label {
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        color: var(--ctp-mauve);
        letter-spacing: 1.2px;
        margin: 16px 0 2px 4px;
        opacity: 0.9;
      }
      .contact-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px 16px;
      }
      .dialog-icon {
        width: 22px;
        height: 22px;
        margin-right: 12px;
        object-fit: contain;
        border-radius: 4px;
      }
      .bio-field {
        textarea {
          min-height: 80px;
          line-height: 1.5;
        }
      }

      ::ng-deep .dark-modal-panel .mat-mdc-dialog-actions {
        justify-content: flex-end;
        gap: 12px;

        button {
          padding: 0 24px !important;
          border-radius: 12px !important;
          height: 44px !important;
          font-weight: 600 !important;
          font-family: 'Outfit', sans-serif !important;
        }

        .save-btn {
          background-color: var(--ctp-mauve) !important;
          color: var(--ctp-crust) !important;
          transition: all 0.2s ease !important;

          &:hover:not(:disabled) {
            background-color: var(--ctp-pink) !important;
            transform: translateY(-2px);
          }

          &:disabled {
            background-color: var(--ctp-surface0) !important;
            color: var(--ctp-overlay0) !important;
          }
        }
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
