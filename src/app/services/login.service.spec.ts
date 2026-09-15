import { TestBed } from '@angular/core/testing';
import { LoginService } from './login.service';

const TOKEN = 'x'.repeat(120);

function storedLogin(overrides: Record<string, unknown> = {}) {
  return {
    email: 'member@example.com',
    idToken: TOKEN,
    refreshToken: 'refresh-token',
    expiresIn: 3600,
    expirationTime: Date.now() + 3600_000,
    ...overrides
  };
}

describe('LoginService', () => {
  let service: LoginService;
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    localStorage.clear();
    fetchSpy = spyOn(window, 'fetch');
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoginService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('logs out and clears the stored session', () => {
    localStorage.setItem('firebaseLogin', JSON.stringify(storedLogin()));
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.getEmail()).toBe('member@example.com');

    service.logout();

    expect(service.isLoggedIn()).toBeFalse();
    expect(service.getEmail()).toBe('');
    expect(localStorage.getItem('firebaseLogin')).toBeNull();
  });

  it('deletes the account then logs out', async () => {
    localStorage.setItem('firebaseLogin', JSON.stringify(storedLogin()));
    fetchSpy.and.returnValues(
      Promise.resolve(new Response(JSON.stringify({
        id_token: TOKEN,
        refresh_token: 'refresh-token',
        expires_in: 3600
      }), { status: 200 })),
      Promise.resolve(new Response(JSON.stringify({
        kind: 'identitytoolkit#DeleteAccountResponse'
      }), { status: 200 }))
    );

    await service.deleteAccount();

    expect(fetchSpy.calls.count()).toBe(2);
    const deleteUrl = fetchSpy.calls.argsFor(1)[0] as string;
    expect(deleteUrl).toContain('accounts:delete');
    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('firebaseLogin')).toBeNull();
  });

  it('does not log out when Firebase rejects deletion', async () => {
    localStorage.setItem('firebaseLogin', JSON.stringify(storedLogin()));
    fetchSpy.and.returnValues(
      Promise.resolve(new Response(JSON.stringify({
        id_token: TOKEN,
        refresh_token: 'refresh-token',
        expires_in: 3600
      }), { status: 200 })),
      Promise.resolve(new Response(JSON.stringify({
        error: { message: 'CREDENTIAL_TOO_OLD_LOGIN_AGAIN' }
      }), { status: 400 }))
    );

    await expectAsync(service.deleteAccount()).toBeRejectedWith(
      jasmine.objectContaining({ code: 'CREDENTIAL_TOO_OLD_LOGIN_AGAIN' })
    );
    expect(service.isLoggedIn()).toBeTrue();
  });
});
