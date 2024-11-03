import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

const API_KEY = environment.firebaseApiKey;

export interface FireBaseLoginResponse {
  kind: string;
  localId: string;
  email: string;
  displayName: string;
  idToken: string;
  registered: string;
  refreshToken: string;
  expiresIn: Date;
}

@Injectable({
  providedIn: 'root'
})
  
export class LoginService {
  public idToken: string = '';
  public isLoggedIn: boolean = false;

  public async login (email: string, password: string) : Promise<FireBaseLoginResponse>{
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
    this.idToken = loginResponse.idToken;
    this.isLoggedIn = (this.idToken != null && this.idToken.length > 100);
    return loginResponse;
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
