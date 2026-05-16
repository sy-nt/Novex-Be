import { TokenAuthProvider } from './token-auth.provider';
import { client as VaultNativeClient } from 'node-vault';

describe('TokenAuthProvider', () => {
  it('uses explicit ttlSeconds without lookup', async () => {
    const provider = new TokenAuthProvider({
      token: 'static-token',
      ttlSeconds: 300,
    });
    const client = {
      token: '',
      tokenLookupSelf: jest.fn(),
    } as unknown as VaultNativeClient;

    await expect(provider.authenticate(client)).resolves.toEqual({
      token: 'static-token',
      renewable: false,
      leaseDurationSec: 300,
    });
    expect(client.tokenLookupSelf).not.toHaveBeenCalled();
  });

  it('throws when lookup fails and ttlSeconds is not set', async () => {
    const provider = new TokenAuthProvider({ token: 'static-token' });
    const client = {
      token: '',
      tokenLookupSelf: jest.fn().mockRejectedValue(new Error('denied')),
    } as unknown as VaultNativeClient;

    await expect(provider.authenticate(client)).rejects.toThrow(
      'token lookup failed',
    );
  });
});
