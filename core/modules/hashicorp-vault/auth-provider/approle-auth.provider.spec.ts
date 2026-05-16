import { AppRoleAuthProvider } from './approle-auth.provider';
import { client as VaultNativeClient } from 'node-vault';

describe('AppRoleAuthProvider', () => {
  const provider = new AppRoleAuthProvider({
    roleId: 'role-id',
    secretId: 'secret-id',
  });

  it('returns an auth session for a valid login response', async () => {
    const client = {
      approleLogin: jest.fn().mockResolvedValue({
        auth: {
          client_token: 'token',
          renewable: true,
          lease_duration: 3600,
        },
      }),
    } as unknown as VaultNativeClient;

    await expect(provider.authenticate(client)).resolves.toEqual({
      token: 'token',
      renewable: true,
      leaseDurationSec: 3600,
    });
  });

  it('throws when login response is invalid', async () => {
    const client = {
      approleLogin: jest.fn().mockResolvedValue({}),
    } as unknown as VaultNativeClient;

    await expect(provider.authenticate(client)).rejects.toThrow(
      'invalid auth response',
    );
  });
});
