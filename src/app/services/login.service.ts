import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

const API_KEY = environment.firebaseApiKey;

export interface FireBaseLoginError {
  error: {
    code: number;
    message: string;
    status: string
  }
}

export interface FireBaseRefreshResponse {
  access_token: string
  expires_in: number
  token_type: string
  refresh_token: string
  id_token: string
  user_id: string
  project_id: string
}

export interface FireBaseLoginResponse {
  kind: string;
  localId: string;
  email: string;
  displayName: string;
  idToken: string;
  registered: string;
  refreshToken: string;
  expiresIn: number;
  expirationTime: number;
}

@Injectable({
  providedIn: 'root'
})

export class LoginService {
  private idToken: string = '';
  private refreshToken: string = '';
  private firebaseLogin:FireBaseLoginResponse | null = null;

  public getFirebaseLogin() {
    if (!this.firebaseLogin) {
      const firebaseLogin = localStorage.getItem("firebaseLogin");
      if (firebaseLogin!=null) {
        this.firebaseLogin = JSON.parse(firebaseLogin)
      }
    }
    return this.firebaseLogin;
  }
  public getIdToken(): string {
    return this.getFirebaseLogin()?.idToken || "";
  }

  public getRefreshToken(): string {
    return this.getFirebaseLogin()?.refreshToken || "";
  }

  public async refresh() : Promise<FireBaseRefreshResponse|null> {
    this.getFirebaseLogin();
    const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: this.getRefreshToken()
      })
    });
    const refreshResponse =  await response.json();

    if ('error' in refreshResponse) {
      localStorage.removeItem("firebaseLogin");
    } else {
      const firebaseLogin = this.getFirebaseLogin() || {};
      const successResponse: FireBaseRefreshResponse = refreshResponse;
      Object.assign(firebaseLogin, {
        expirationTime: Date.now() + successResponse.expires_in * 1000,
        idToken: successResponse.id_token,
        refreshToken: successResponse.refresh_token,
        expiresIn: successResponse.expires_in,
      });
      localStorage.setItem("firebaseLogin", JSON.stringify(firebaseLogin));  
      return successResponse;
    }
    return null;
  }

  public async login (email: string, password: string) : Promise<FireBaseLoginResponse>{
    const firebaseLogin = localStorage.getItem("firebaseLogin");
    const loginInfo: FireBaseLoginResponse = (firebaseLogin != null) ? JSON.parse(firebaseLogin) : null;

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });
    const loginResponse:FireBaseLoginResponse = await response.json();
    loginResponse.expirationTime = Date.now() + loginResponse.expiresIn * 1000; // Convert to milliseconds

    localStorage.setItem("firebaseLogin", JSON.stringify(loginResponse));

    this.firebaseLogin = loginResponse;
    return loginResponse;
  }

  public isLoggedIn(): boolean {
    return (this.getIdToken() != null && this.getIdToken().length > 100);
  }
  public async sendEmailVerification(idToken: string) {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestType: 'VERIFY_EMAIL',
        idToken: idToken  
      })
    });
    return response.json();
  }

  public async signUp (email: string, password: string) {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });
    return response.json();
  }

};
