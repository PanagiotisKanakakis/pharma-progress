import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {Role, User} from 'app/auth/models';
import {ToastrService} from 'ngx-toastr';
import {KEYCLOAK_TOKEN_URL, USER_PROFILE_URL} from '../../api/auth/auth.config';
import {ActivatedRoute, Router} from '@angular/router';
import axios from 'axios';
import {plainToInstance} from 'class-transformer';


@Injectable({providedIn: 'root'})
export class AuthenticationService {
    // public
    public currentUser: Observable<User>;
    public returnUrl: string;

    // private
    private currentUserSubject: BehaviorSubject<User>;

    /**
     *
     * @param {HttpClient} _http
     * @param {ToastrService} _toastrService
     * @param _route
     * @param _router
     */
    constructor(private _http: HttpClient,
                private _toastrService: ToastrService,
                private _route: ActivatedRoute,
                private _router: Router) {
        this.currentUserSubject = new BehaviorSubject<User>(JSON.parse(localStorage.getItem('currentUser')));
        this.currentUser = this.currentUserSubject.asObservable();
        this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/';
    }

    // getter: currentUserValue
    public get currentUserValue(): User {
        return this.currentUserSubject.value;
    }

    /**
     *  Confirms if user is admin
     */
    get isAdmin() {
        return this.currentUser && this.currentUserSubject.value.role === Role.Admin;
    }

    /**
     *  Confirms if user is client
     */
    get isClient() {
        return this.currentUser && this.currentUserSubject.value.role === Role.Client;
    }

    /**
     * User login
     *
     * @param email
     * @param password
     * @returns user
     */
    async login(email: string, password: string) {
        var accessToken = await this.acquireToken(email, password);
        return axios.get<any>(USER_PROFILE_URL,
            {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + accessToken
                }
            })
            .then((userInfo) => {
                userInfo.data.token = accessToken;
                userInfo.data.role = Role.Admin;
                userInfo.data.avatar = 'avatar-s-11.jpg';
                const user = plainToInstance(User, userInfo.data);
                localStorage.setItem('currentUser', JSON.stringify(user));
                this.currentUserSubject.next(user);
                this._router.navigate([this.returnUrl]);
            })
            .catch((error) => {
                return error;
            });
    }

    /**
     * User logout
     *
     */
    logout() {
        // remove user from local storage to log user out
        localStorage.removeItem('currentUser');
        // notify
        this.currentUserSubject.next(null);
    }

    async acquireToken(email: string, password: string) {
        return await axios.post<any>(
            KEYCLOAK_TOKEN_URL,
            new URLSearchParams({
                client_id: 'pharma-app',
                username: email,
                password: password,
                grant_type: 'password',
                client_secret: 'j3LeI9M31LuYOQrphX2N1HHwtVUrVdzS'
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Access-Control-Allow-Origin': '*'
                }
            }).then((response) => {
            return response.data.access_token;
        });
    }
}
