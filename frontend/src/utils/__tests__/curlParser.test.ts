import { describe, it, expect } from 'vitest';
import { parseCurl } from '../curlParser';

describe('curlParser', () => {
  it('throws an error for empty or whitespace-only input', () => {
    expect(() => parseCurl('')).toThrow('Please enter a cURL command');
    expect(() => parseCurl('   ')).toThrow('Please enter a cURL command');
  });

  it('throws an error if input does not start with curl', () => {
    expect(() => parseCurl('wget https://api.example.com')).toThrow(
      'Command must begin with "curl"'
    );
  });

  it('parses a basic GET request', () => {
    const result = parseCurl('curl https://api.example.com/v1/users');
    expect(result.url).toBe('https://api.example.com/v1/users');
    expect(result.method).toBe('GET');
    expect(result.body).toBe('');
  });

  it('strips leading prompt symbol', () => {
    const result = parseCurl('$ curl https://api.example.com/test');
    expect(result.url).toBe('https://api.example.com/test');
    expect(result.method).toBe('GET');
  });

  it('handles multi-line backslash-escaped commands', () => {
    const cmd = `curl 'https://api.example.com/items' \\
      -H 'Accept: application/json' \\
      -H 'X-Custom-Header: value123'`;
    const result = parseCurl(cmd);
    expect(result.url).toBe('https://api.example.com/items');
    expect(result.method).toBe('GET');
    expect(result.headers).toEqual([
      { key: 'Accept', value: 'application/json', enabled: true },
      { key: 'X-Custom-Header', value: 'value123', enabled: true },
    ]);
  });

  it('parses POST request with JSON body and custom method flag', () => {
    const cmd = `curl -X POST https://api.example.com/login -H "Content-Type: application/json" -d '{"username":"admin"}'`;
    const result = parseCurl(cmd);
    expect(result.url).toBe('https://api.example.com/login');
    expect(result.method).toBe('POST');
    expect(result.headers).toContainEqual({
      key: 'Content-Type',
      value: 'application/json',
      enabled: true,
    });
    expect(JSON.parse(result.body)).toEqual({ username: 'admin' });
  });

  it('defaults method to POST if data is provided without explicit -X', () => {
    const cmd = `curl https://api.example.com/create --data '{"id":1}'`;
    const result = parseCurl(cmd);
    expect(result.method).toBe('POST');
    expect(result.url).toBe('https://api.example.com/create');
  });

  it('handles basic auth (-u)', () => {
    const username = 'alice';
    const password = 'wonderland';
    const credentials = [username, password].join(':');
    const cmd = ['curl', '-u', credentials, 'https://api.example.com/protected'].join(' ');
    const result = parseCurl(cmd);
    expect(result.headers).toContainEqual({
      key: 'Authorization',
      value: `Basic ${btoa(credentials)}`,
      enabled: true,
    });
  });

  it('handles equals-syntax for flags (--request=PUT, --header=...)', () => {
    const cmd = `curl --request=PUT --url=https://api.example.com/resource --header="X-Client-Id: 12345"`;
    const result = parseCurl(cmd);
    expect(result.method).toBe('PUT');
    expect(result.url).toBe('https://api.example.com/resource');
    expect(result.headers).toContainEqual({
      key: 'X-Client-Id',
      value: '12345',
      enabled: true,
    });
  });

  it('parses User-Agent and Referer shortcuts', () => {
    const cmd = `curl -A "CustomAgent/1.0" -e "https://google.com" https://api.example.com`;
    const result = parseCurl(cmd);
    expect(result.headers).toContainEqual({
      key: 'User-Agent',
      value: 'CustomAgent/1.0',
      enabled: true,
    });
    expect(result.headers).toContainEqual({
      key: 'Referer',
      value: 'https://google.com',
      enabled: true,
    });
  });

  it('throws an error if no URL is specified', () => {
    expect(() => parseCurl('curl -X POST -H "Content-Type: application/json"')).toThrow(
      'No target URL found in cURL command'
    );
  });
});
