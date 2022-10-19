import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { CoreConfigService } from '@core/services/config.service';
import {locale as english} from '../../../../common/i18n/en';
import {locale as greek} from '../../../../common/i18n/gr';
import {CoreTranslationService} from '../../../../../@core/services/translation.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthenticationService} from '../../../../auth/service';

@Component({
  selector: 'app-auth-register-v2',
  templateUrl: './auth-register-v2.component.html',
  styleUrls: ['./auth-register-v2.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthRegisterV2Component implements OnInit {
  // Public
  public coreConfig: any;
  public passwordTextType: boolean;
  public registerForm: FormGroup;
  public submitted = false;
  public loading = false;
  public error = '';

  // Private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   *
   * @param {CoreConfigService} _coreConfigService
   * @param {FormBuilder} _formBuilder
   * @param _route
   * @param _router
   * @param _authenticationService
   * @param _coreTranslationService
   */
  constructor(private _coreConfigService: CoreConfigService,
              private _formBuilder: FormBuilder,
              private _route: ActivatedRoute,
              private _router: Router,
              private _authenticationService: AuthenticationService,
              private _coreTranslationService: CoreTranslationService,
  ) {
    this._unsubscribeAll = new Subject();
    this._coreTranslationService.translate(english, greek);
    // Configure the layout
    this._coreConfigService.config = {
      layout: {
        navbar: {
          hidden: true
        },
        menu: {
          hidden: true
        },
        footer: {
          hidden: true
        },
        customizer: false,
        enableLocalStorage: false
      }
    };
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.registerForm.controls;
  }

  /**
   * Toggle password
   */
  togglePasswordTextType() {
    this.passwordTextType = !this.passwordTextType;
  }

  /**
   * On Submit
   */
  onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }
    console.log(this.f.firstname.value)
    // Login
    this.loading = true
    this._authenticationService
        .register(
            this.f.firstname.value,
            this.f.surname.value,
            this.f.username.value,
            this.f.password.value,
            this.f.email.value,
            this.f.business_type.value,
            this.f.opening_balance.value,
        )
        .catch((error) => {
          this.error = error;
          this.loading = false;
        });
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    this.registerForm = this._formBuilder.group({
      firstname: ['', [Validators.required]],
      surname: ['', [Validators.required]],
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      business_type: ['', Validators.required],
      opening_balance: ['', Validators.required],
    });

    // Subscribe to config changes
    this._coreConfigService.config.pipe(takeUntil(this._unsubscribeAll)).subscribe(config => {
      this.coreConfig = config;
    });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
