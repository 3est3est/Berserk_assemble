import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AddMission } from '../../_models/add-mission';

@Component({
  selector: 'app-new-mission',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './new-mission.html',
  styleUrl: './new-mission.scss',
})
export class NewMission {
  private readonly _dialogRef = inject(MatDialogRef<NewMission>);
  private readonly _data = inject(MAT_DIALOG_DATA, { optional: true });

  addMission: any = {
    name: this._data?.name || '',
    description: this._data?.description || '',
    max_crew: this._data?.max_crew || 5,
    scheduled_at: this._data?.scheduled_at
      ? new Date(this._data.scheduled_at).toISOString().slice(0, 16)
      : '',
    location: this._data?.location || '',
  };

  onSubmit() {
    const mission = this.clean(this.addMission);
    this._dialogRef.close(mission);
  }

  private clean(addMission: any): AddMission {
    console.log(
      'DEBUG: Raw form value:',
      addMission.scheduled_at,
      'Type:',
      typeof addMission.scheduled_at,
    );

    const result = {
      name: addMission.name.trim() || 'untitle',
      description: addMission.description?.trim() || undefined,
      max_crew: addMission.max_crew && addMission.max_crew > 0 ? addMission.max_crew : 5,
      scheduled_at: addMission.scheduled_at ? new Date(addMission.scheduled_at) : undefined,
      location: addMission.location?.trim() || undefined,
    };

    console.log('DEBUG: Payload ready to send:', result);
    return result;
  }
}
