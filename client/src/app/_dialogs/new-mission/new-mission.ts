import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AddMission } from '../../_models/add-mission';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';

@Component({
  selector: 'app-new-mission',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputNumberModule,
    DatePickerModule,
  ],
  templateUrl: './new-mission.html',
  styleUrl: './new-mission.scss',
})
export class NewMission {
  public readonly _ref = inject(DynamicDialogRef);
  public readonly _config = inject(DynamicDialogConfig);

  categories = [
    { label: 'Sports & Active', value: 'Sports & Active' },
    { label: 'Social & Chill', value: 'Social & Chill' },
    { label: 'Gaming & E-Sports', value: 'Gaming & E-Sports' },
    { label: 'Entertainment', value: 'Entertainment' },
    { label: 'Travel & Trip', value: 'Travel & Trip' },
    { label: 'Lifestyle & Hobby', value: 'Lifestyle & Hobby' },
    { label: 'Other', value: 'Other' },
  ];

  addMission: any = {
    name: this._config.data?.name || '',
    description: this._config.data?.description || '',
    max_crew: this._config.data?.max_crew || 5,
    scheduled_at: this._config.data?.scheduled_at ? new Date(this._config.data.scheduled_at) : null,
    location: this._config.data?.location || '',
    category: this._config.data?.category || 'Other',
  };

  onSubmit() {
    const mission = this.clean(this.addMission);
    this._ref.close(mission);
  }

  private clean(addMission: any): AddMission {
    return {
      name: addMission.name.trim() || 'untitle',
      description: addMission.description?.trim() || undefined,
      max_crew: addMission.max_crew && addMission.max_crew > 0 ? addMission.max_crew : 5,
      scheduled_at: addMission.scheduled_at ? new Date(addMission.scheduled_at) : undefined,
      location: addMission.location?.trim() || undefined,
      category: addMission.category || 'Other',
    };
  }
}
