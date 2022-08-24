import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {UserInfo} from '../auth/auth.interfaces';
import {signOut} from "../auth/auth.api";

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _currentUserSubject: BehaviorSubject<UserInfo>;
  private _currentUser: Observable<UserInfo>;

  constructor() {
    this._currentUserSubject = new BehaviorSubject<UserInfo>(JSON.parse(localStorage.getItem('currentUser') || '{}'));
    this._currentUser = this._currentUserSubject.asObservable();
  }


  get currentUserSubject(): BehaviorSubject<UserInfo> {
    return this._currentUserSubject;
  }

  set currentUserSubject(value: BehaviorSubject<UserInfo>) {
    this._currentUserSubject = value;
  }

  get currentUser(): Observable<UserInfo> {
    return this._currentUser;
  }

  set currentUser(value: Observable<UserInfo>) {
    this._currentUser = value;
  }

  get loggedInUser(): UserInfo {
    return this._currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this._currentUserSubject.value.username !== undefined;
  }

  logout() {
    // remove user from local storage and set current user to null
    localStorage.removeItem('currentUser');
    signOut();
    // this.currentUserSubject = new BehaviorSubject<UserInfo>(JSON.parse('{}'));
  }
}
