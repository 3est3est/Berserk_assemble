import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { passwordMatchValidator, PasswordValidator } from '../_helpers/password-validator';
import { Router } from '@angular/router';
import { PassportService } from '../_services/passport-service';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, ButtonModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private usernameMinLength = 4;
  private usernameMaxLength = 10;
  private passwordMinLength = 8;
  private passwordMaxLength = 10;
  private displaynameMinLength = 3;

  mode: 'login' | ' register' = 'login';
  form: FormGroup;
  errorMsg = {
    username: signal(''),
    password: signal(''),
    display_name: signal(''),
    cf_password: signal(''),
    server: signal(''),
  };

  private _router = inject(Router);
  private _passport = inject(PassportService);

  constructor() {
    if (this._passport.data()) this._router.navigate(['/']);

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
    this.mode = this.mode == 'login' ? ' register' : 'login';
    this.updateForm();
  }
  updateForm() {
    if (this.mode === 'login') {
      this.form.removeControl('cf_password');
      this.form.removeValidators(passwordMatchValidator('password', 'cf_password'));
      this.form.removeControl('display_name');
    } else {
      this.form.addControl('cf_password', new FormControl(null, [Validators.required]));
      this.form.addValidators(passwordMatchValidator('password', 'cf_password'));
      this.form.addControl(
        'display_name',
        new FormControl(null, [
          Validators.required,
          Validators.minLength(this.displaynameMinLength),
        ]),
      );
    }
  }

  updateErrorMsg(ctrlName: string): void | null {
    const ctrl = this.form.controls[ctrlName];
    if (!ctrl) return null;

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
            `must be ${this.passwordMinLength} - ${this.passwordMaxLength} characters`,
          );
        else if (ctrl.hasError('invalidLowerCase'))
          this.errorMsg.password.set(`must contain minimum of 1 lower-case letter [a-z]`);
        else if (ctrl.hasError('invalidUpperCase'))
          this.errorMsg.password.set(`must contain minimum of 1 upper-case letter [A-Z]`);
        else if (ctrl.hasError('invalidNumeric'))
          this.errorMsg.password.set(`must contain minimum of 1 numeric [0-9]`);
        else if (ctrl.hasError('invalidSpecialChar'))
          this.errorMsg.password.set(
            `must contain minimum of 1 special character [!@#$%^&*(),.?":{}|<>]`,
          );
        else this.errorMsg.password.set('');
        break;
      case 'display_name':
        if (ctrl.hasError('required')) this.errorMsg.display_name.set('required');
        else if (ctrl.hasError('minlength'))
          this.errorMsg.display_name.set(
            `must be at least ${this.displaynameMinLength} characters long`,
          );
        else this.errorMsg.display_name.set('');
        break;
      case 'cf_password':
        if (ctrl.hasError('required')) this.errorMsg.cf_password.set('required');
        else if (ctrl.hasError('mismatch')) this.errorMsg.cf_password.set('do not match password');
        else this.errorMsg.cf_password.set('');
        break;
    }
  }
  async onSubmit() {
    this.errorMsg.server.set('');
    let errMsg: string | null = null;
    if (this.mode === 'login') {
      errMsg = await this._passport.get(this.form.value);
    } else {
      errMsg = await this._passport.register(this.form.value);
    }
    if (!errMsg) this._router.navigate(['/']);
    else {
      this.errorMsg.server.set(errMsg);
    }
  }
}
