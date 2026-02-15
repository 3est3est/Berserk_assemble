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
    <div class="glass-surface border border-white/10 rounded-2xl overflow-hidden min-w-[460px]">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <h2 class="text-xs font-black uppercase tracking-[0.2em] opacity-60 m-0">
          Protocol: Edit Profile
        </h2>
        <i
          class="pi pi-times cursor-pointer opacity-40 hover:opacity-100 transition-all"
          (click)="ref.close()"
        ></i>
      </div>

      <!-- Body -->
      <div class="p-6 flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-indigo-400"
            >Display Name</label
          >
          <input
            pInputText
            [(ngModel)]="displayName"
            class="w-full bg-white/5 border-white/10 h-11 text-sm font-medium focus:border-indigo-500/50 transition-all"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-[10px] font-black uppercase tracking-widest text-indigo-400"
            >Biological Directive / Motto</label
          >
          <textarea
            pTextarea
            [(ngModel)]="bio"
            [autoResize]="true"
            rows="3"
            class="w-full bg-white/5 border-white/10 text-sm font-medium focus:border-indigo-500/50 transition-all"
          ></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-indigo-400"
              >Instagram</label
            >
            <div class="relative w-full">
              <i
                class="pi pi-instagram absolute left-3 top-1/2 -translate-y-1/2 text-[10px] opacity-40"
              ></i>
              <input
                pInputText
                [(ngModel)]="instagram"
                placeholder="@user"
                class="w-full bg-white/5 border-white/10 h-10 text-[11px] pl-8"
              />
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-indigo-400"
              >Facebook</label
            >
            <div class="relative w-full">
              <i
                class="pi pi-facebook absolute left-3 top-1/2 -translate-y-1/2 text-[10px] opacity-40"
              ></i>
              <input
                pInputText
                [(ngModel)]="facebook"
                placeholder="Name"
                class="w-full bg-white/5 border-white/10 h-10 text-[11px] pl-8"
              />
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-indigo-400"
              >Discord ID</label
            >
            <div class="relative w-full">
              <i
                class="pi pi-discord absolute left-3 top-1/2 -translate-y-1/2 text-[10px] opacity-40"
              ></i>
              <input
                pInputText
                [(ngModel)]="discordId"
                placeholder="user#0000"
                class="w-full bg-white/5 border-white/10 h-10 text-[11px] pl-8"
              />
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-indigo-400"
              >Email Reference</label
            >
            <div class="relative w-full">
              <i
                class="pi pi-envelope absolute left-3 top-1/2 -translate-y-1/2 text-[10px] opacity-40"
              ></i>
              <input
                pInputText
                [(ngModel)]="contactEmail"
                placeholder="your@email.com"
                class="w-full bg-white/5 border-white/10 h-10 text-[11px] pl-8"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 bg-white/5 border-t border-white/5 flex justify-end gap-3">
        <button
          pButton
          label="ABORT"
          (click)="ref.close()"
          class="p-button-text p-button-sm text-[9px] font-black tracking-widest"
        ></button>
        <button
          pButton
          label="SYNCHRONIZE"
          (click)="save()"
          [disabled]="!displayName"
          class="p-button-primary h-10 px-6 text-[9px] font-black tracking-widest shadow-lg shadow-indigo-500/20"
        ></button>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        background: transparent;
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
