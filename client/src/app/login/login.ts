import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { passwordMatchValidator, PasswordValidator } from '../_helpers/password-validator';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { PassportService } from '../_services/passport-service';
import { MatButtonModule } from '@angular/material/button';
@Component({
  selector: 'app-login',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private usernameMinLength = 4;
  private usernameMaxLength = 10;
  private passwordMinLength = 8;
  private passwordMaxLength = 10;
  private displayNameMinLength = 3;

  mode: 'login' | 'register' = 'login';
  form: FormGroup;
  errorMsg = {
    username: signal(''),
    password: signal(''),
    display_name: signal(''),
    cf_password: signal(''),
  };

  private _router = inject(Router);
  private _passport = inject(PassportService);

  private matchValidator = passwordMatchValidator('password', 'cf_password');

  constructor() {
    this.form = new FormGroup({
      username: new FormControl(null, [
        Validators.required,
        Validators.minLength(this.usernameMinLength),
        Validators.maxLength(this.usernameMaxLength),
      ]),
      password: new FormControl(null, [
        Validators.required,
        PasswordValidator(this.passwordMinLength, this.passwordMaxLength),
      ]),
    });
  }
  toggleMode() {
    this.mode = this.mode == 'login' ? 'register' : 'login';
    this.updateForm();
  }
  updateForm() {
    if (this.mode === 'login') {
      this.form.removeControl('cf_password');
      this.form.removeValidators(this.matchValidator);
      this.form.removeControl('display_name');
    } else {
      this.form.addControl('cf_password', new FormControl(null, [Validators.required]));
      this.form.addValidators(this.matchValidator);
      this.form.addControl(
        'display_name',
        new FormControl(null, [
          Validators.required,
          Validators.minLength(this.displayNameMinLength),
        ])
      );
    }
  }

  updateErrorMsg(ctrlName: string): void | null {
    const ctrl = this.form.controls[ctrlName];
    if (!ctrl) return null;
    console.log('pass', ctrlName);
    switch (ctrlName) {
      case 'username':
        if (ctrl.hasError('required')) this.errorMsg.username.set('required');
        else if (ctrl.hasError('minlength'))
          this.errorMsg.username.set(`must be at least ${this.usernameMinLength} characters`);
        else if (ctrl.hasError('maxlength'))
          this.errorMsg.username.set(`must be at most ${this.usernameMaxLength} characters`);
        else this.errorMsg.username.set('');
        break;
      case 'password':
        if (ctrl.hasError('required')) this.errorMsg.password.set('required');
        else if (ctrl.hasError('invalidLength'))
          this.errorMsg.password.set(
            `must be ${this.passwordMinLength} - ${this.passwordMaxLength} characters`
          );
        else if (ctrl.hasError('invalidLowerCase'))
          this.errorMsg.password.set(`must contain mimimi, of 1 lower-case letter [a-z]`);
        else if (ctrl.hasError('invalidUpperCase'))
          this.errorMsg.password.set(`must contain mimimi, of 1 upper-case letter [A-Z]`);
        else if (ctrl.hasError('invalidNumeric'))
          this.errorMsg.password.set(`must contain mimimi, of 1 numeric [0-9]`);
        else if (ctrl.hasError('invalidSpecialChar'))
          this.errorMsg.password.set(
            `must contain mimimi, of 1 special character [!@#$%^&*(),.?":{}|<>]`
          );
        else this.errorMsg.password.set('');
        break;
      case 'display_name':
        if (ctrl.hasError('required')) this.errorMsg.display_name.set('required');
        else if (ctrl.hasError('minlength'))
          this.errorMsg.display_name.set(
            `must be at least ${this.displayNameMinLength} characters log`
          );
        else this.errorMsg.display_name.set('');
        break;
      case 'cf_password':
        if (ctrl.hasError('required')) this.errorMsg.cf_password.set('required');
        else if (ctrl.hasError('mismatch')) this.errorMsg.cf_password.set('do not match password');
        else this.errorMsg.cf_password.set('');
        break;
    }

    console.log('errmsg :', this.errorMsg.password());
  }
  async onSubmit() {
    if (this.mode === 'login') {
      const errMsg = await this._passport.get(this.form.value);
      if (!errMsg) this._router.navigate(['/']);
    } else {
      const errMsg = await this._passport.register(this.form.value);
      if (!errMsg) this._router.navigate(['/']);
      else alert(errMsg);
    }
  }
}
