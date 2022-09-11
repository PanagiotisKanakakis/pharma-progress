import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';

import {AuthenticationService} from 'app/auth/service';
import {CoreConfigService} from '@core/services/config.service';
import {CoreTranslationService} from '../../../../../@core/services/translation.service';
import {locale as english} from '../../../../common/i18n/en';
import {locale as greek} from '../../../../common/i18n/gr';

@Component({
    selector: 'app-auth-login-v2',
    templateUrl: './auth-login-v2.component.html',
    styleUrls: ['./auth-login-v2.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class AuthLoginV2Component implements OnInit {
    //  Public
    public coreConfig: any;
    public loginForm: FormGroup;
    public loading = false;
    public submitted = false;
    public returnUrl: string;
    public error = '';
    public passwordTextType: boolean;

    // Private
    private _unsubscribeAll: Subject<any>;

    /**
     * Constructor
     *
     * @param {CoreConfigService} _coreConfigService
     * @param _formBuilder
     * @param _route
     * @param _router
     * @param _authenticationService
     * @param _coreTranslationService
     */
    constructor(
        private _coreConfigService: CoreConfigService,
        private _formBuilder: FormBuilder,
        private _route: ActivatedRoute,
        private _router: Router,
        private _authenticationService: AuthenticationService,
        private _coreTranslationService: CoreTranslationService,
    ) {
        // redirect to home if already logged in
        if (this._authenticationService.currentUserValue) {
            this._router.navigate(['/']);
        }
        this._coreTranslationService.translate(english, greek);

        this._unsubscribeAll = new Subject();

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
        return this.loginForm.controls;
    }

    /**
     * Toggle password
     */
    togglePasswordTextType() {
        this.passwordTextType = !this.passwordTextType;
    }

    onSubmit() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.loginForm.invalid) {
            return;
        }

        // Login
        this.loading = true;
        this._authenticationService
            .login(this.f.username.value, this.f.password.value)
            .catch((error) => {
                console.log(error);
                if (error.response.status === 400) {
                    this.error = 'Ο λογαριασμός δεν έχει ενεργοποιηθεί!';
                } else if (error.response.status === 401) {
                    this.error = 'Λανθασμένα στοιχεία!';
                } else {
                    this.error = error;
                }
                this.loading = false;
            });
    }

    // Lifecycle Hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.loginForm = this._formBuilder.group({
            username: ['', [Validators.required]],
            password: ['', Validators.required]
        });

        // get return url from route parameters or default to '/'
        this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/';

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
