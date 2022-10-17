import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {Role, User} from 'app/auth/models';
import {ToastrService} from 'ngx-toastr';
import {
    KEYCLOAK_ADMIN_TOKEN_URL,
    KEYCLOAK_REGISTER_USER_URL,
    KEYCLOAK_USER_TOKEN_URL,
    USER_PROFILE_URL
} from '../../api/auth/auth.config';
import {ActivatedRoute, Router} from '@angular/router';
import axios, {AxiosResponse} from 'axios';
import {plainToInstance} from 'class-transformer';
import {environment} from '../../../environments/environment';


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
     * @param username
     * @param password
     * @returns user
     */
    async login(username: string, password: string) {
        const accessToken = await this.acquireUserToken(username, password);
        return axios.get<any>(USER_PROFILE_URL,
            {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': 'Bearer ' + accessToken,
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

    async register(firstname: string, lastname: string, username: string , password: string, email: string) {
        const accessToken = await this.acquireAdminToken();
        return axios.post<any>(KEYCLOAK_REGISTER_USER_URL,
            JSON.stringify({
                firstName: firstname,
                lastName: lastname,
                email: email,
                emailVerified: 'true',
                groups: [],
                enabled: 'false',
                username: username,
                credentials: [{
                    type: 'password',
                    value: password,
                    temporary: 'false'
                }]
            }),
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + accessToken,
                }
            })
            .then((response) => {
                console.log(response);
            })
            .catch((error) => {
                console.log(error);
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

    async acquireAdminToken() {
        return await axios.post<any>(
            KEYCLOAK_ADMIN_TOKEN_URL,
            new URLSearchParams({
                grant_type: 'password',
                client_id: 'admin-cli',
                username: environment.KEYCLOAK_USER,
                password: environment.KEYCLOAK_PASSWORD,
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }).then((response) => {
            return response.data.access_token;
        });
    }

    async acquireUserToken(username: string, password: string) {
        return await axios.post<any>(
            KEYCLOAK_USER_TOKEN_URL,
            new URLSearchParams({
                client_id: environment.CLIENT_ID,
                username: username,
                password: password,
                grant_type: 'password',
                client_secret: environment.CLIENT_SECRET
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }).then((response) => {
            return response.data.access_token;
        });
    }
}
