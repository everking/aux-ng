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
    return loginResponse;
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