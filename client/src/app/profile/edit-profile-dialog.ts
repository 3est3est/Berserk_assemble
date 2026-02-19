import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { FormsModule } from '@angular/forms';
import { UserService } from '../_services/user-service';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-edit-profile-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule],
  template: `
    <div class="edit-profile-dialog">
      <!-- Header -->
      <div class="ep-header">
        <div class="ep-header-icon">
          <i class="pi pi-user-edit"></i>
        </div>
        <div>
          <h2 class="ep-title">Edit Profile</h2>
          <p class="ep-subtitle">Information updates immediately</p>
        </div>
        <button class="ep-close-btn" (click)="ref.close()">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="ep-body">
        <div class="ep-field">
          <label class="ep-label">Display Name</label>
          <input pInputText [(ngModel)]="displayName" placeholder="Your name" class="ep-input" />
        </div>

        <div class="ep-field">
          <label class="ep-label">Bio / Quote</label>
          <textarea
            pTextarea
            [(ngModel)]="bio"
            [autoResize]="true"
            rows="3"
            placeholder="Tell us about yourself..."
            class="ep-textarea"
          ></textarea>
        </div>

        <div class="ep-section-label">Social Links</div>
        <div class="ep-grid">
          <div class="ep-field">
            <label class="ep-label"><i class="pi pi-instagram"></i> Instagram</label>
            <input pInputText [(ngModel)]="instagram" placeholder="@username" class="ep-input" />
          </div>
          <div class="ep-field">
            <label class="ep-label"><i class="pi pi-facebook"></i> Facebook</label>
            <input pInputText [(ngModel)]="facebook" placeholder="ชื่อ Facebook" class="ep-input" />
          </div>
          <div class="ep-field">
            <label class="ep-label"><i class="pi pi-discord"></i> Discord</label>
            <input pInputText [(ngModel)]="discordId" placeholder="user#0000" class="ep-input" />
          </div>
          <div class="ep-field">
            <label class="ep-label"><i class="pi pi-envelope"></i> Email</label>
            <input
              pInputText
              [(ngModel)]="contactEmail"
              placeholder="your@email.com"
              class="ep-input"
            />
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="ep-footer">
        <button pButton label="Cancel" (click)="ref.close()" class="ep-btn-cancel"></button>
        <button
          pButton
          label="Save Changes"
          icon="pi pi-check"
          (click)="save()"
          [disabled]="!displayName"
          class="ep-btn-save"
        ></button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .edit-profile-dialog {
        width: 480px;
        display: flex;
        flex-direction: column;
        background: rgba(10, 10, 12, 0.98);
        border-radius: 24px;
        overflow: hidden;
      }

      .ep-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem 1.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        background: rgba(255, 255, 255, 0.02);
      }

      .ep-header-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: var(--accent-subtle);
        border: 1px solid var(--accent-border);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .ep-header-icon i {
        font-size: 16px;
        color: var(--accent);
      }

      .ep-title {
        font-size: 15px;
        font-weight: 900;
        color: white;
        margin: 0;
      }
      .ep-subtitle {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.3);
        margin: 3px 0 0;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .ep-close-btn {
        margin-left: auto;
        background: none;
        border: none;
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.3);
        transition: all 0.2s;
      }
      .ep-close-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        color: white;
      }

      .ep-body {
        padding: 1.5rem 1.75rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow-y: auto;
        max-height: calc(90vh - 160px);
      }
      .ep-body::-webkit-scrollbar {
        width: 3px;
      }
      .ep-body::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
      }

      .ep-field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .ep-label {
        font-size: 9px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: var(--accent);
        opacity: 0.7;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .ep-label i {
        font-size: 10px;
      }

      .ep-section-label {
        font-size: 8px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: rgba(255, 255, 255, 0.2);
        padding: 0.5rem 0 0;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
        margin-top: 0.25rem;
      }

      .ep-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }

      .ep-input {
        width: 100% !important;
        background: rgba(255, 255, 255, 0.03) !important;
        border: 1px solid rgba(255, 255, 255, 0.07) !important;
        border-radius: 12px !important;
        color: white !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        padding: 0 1rem !important;
        height: 44px;
        transition: border-color 0.2s !important;
      }
      .ep-input::placeholder {
        color: rgba(255, 255, 255, 0.2) !important;
      }
      .ep-input:focus {
        border-color: var(--accent) !important;
        outline: none !important;
        box-shadow: 0 0 0 3px var(--accent-subtle) !important;
      }

      .ep-textarea {
        width: 100% !important;
        background: rgba(255, 255, 255, 0.03) !important;
        border: 1px solid rgba(255, 255, 255, 0.07) !important;
        border-radius: 12px !important;
        color: white !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        padding: 0.875rem 1rem !important;
        resize: none;
        line-height: 1.6;
        transition: border-color 0.2s !important;
      }
      .ep-textarea::placeholder {
        color: rgba(255, 255, 255, 0.2) !important;
      }
      .ep-textarea:focus {
        border-color: var(--accent) !important;
        outline: none !important;
        box-shadow: 0 0 0 3px var(--accent-subtle) !important;
      }

      .ep-footer {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 1.25rem 1.75rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(255, 255, 255, 0.01);
      }

      .ep-btn-cancel {
        background: transparent !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        color: rgba(255, 255, 255, 0.4) !important;
        border-radius: 12px !important;
        height: 44px !important;
        padding: 0 1.25rem !important;
        font-size: 11px !important;
        font-weight: 800 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.1em !important;
        transition: all 0.2s !important;
      }
      .ep-btn-cancel:hover {
        border-color: rgba(255, 255, 255, 0.2) !important;
        color: white !important;
      }

      .ep-btn-save {
        background: var(--accent) !important;
        border: none !important;
        border-radius: 12px !important;
        height: 44px !important;
        padding: 0 1.75rem !important;
        font-size: 11px !important;
        font-weight: 900 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.1em !important;
        color: white !important;
        box-shadow: 0 4px 20px rgba(255, 78, 171, 0.25) !important;
        transition: all 0.2s !important;
      }
      .ep-btn-save:hover:not(:disabled) {
        transform: translateY(-1px) !important;
        box-shadow: 0 8px 28px rgba(255, 78, 171, 0.4) !important;
      }
      .ep-btn-save:disabled {
        opacity: 0.3 !important;
        transform: none !important;
        box-shadow: none !important;
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
  public ref = inject(DynamicDialogRef);
  public config = inject(DynamicDialogConfig);

  constructor() {
    const data = this.config.data;
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
      this.ref.close(true);
    } else {
      console.error(error);
    }
  }
}
