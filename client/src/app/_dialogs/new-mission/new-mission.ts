import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AddMission } from '../../_models/add-mission';

@Component({
  selector: 'app-new-mission',
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
  templateUrl: './new-mission.html',
  styleUrl: './new-mission.scss',
})
export class NewMission {
  private readonly _dialogRef = inject(MatDialogRef<NewMission>);
  private readonly _data = inject(MAT_DIALOG_DATA, { optional: true });

  addMission: AddMission = {
    name: this._data?.name || '',
    description: this._data?.description || '',
  };

  onSubmit() {
    const mission = this.clean(this.addMission);
    this._dialogRef.close(mission);
  }

  private clean(addMission: AddMission): AddMission {
    return {
      name: addMission.name.trim() || 'untitle',
      description: addMission.description?.trim() || undefined,
    };
  }
}
