export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'QUERY';

export interface ParsedCurl {
  url: string;
  method: HttpMethod;
  headers: Array<{ key: string; value: string; enabled: boolean }>;
  body: string;
}

function tokenizeArgs(cmd: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;

  for (let i = 0; i < cmd.length; i++) {
    const char = cmd[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\' && !inSingleQuote) {
      escaped = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (/\s/.test(char) && !inSingleQuote && !inDoubleQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

function normalizeMethod(raw: string): HttpMethod {
  const upper = raw.trim().toUpperCase();
  const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'QUERY'];
  if (validMethods.includes(upper as HttpMethod)) {
    return upper as HttpMethod;
  }
  return 'GET';
}

function addHeader(
  rawHeader: string,
  headersList: Array<{ key: string; value: string; enabled: boolean }>
): void {
  const colonIndex = rawHeader.indexOf(':');
  if (colonIndex > 0) {
    const key = rawHeader.slice(0, colonIndex).trim();
    const value = rawHeader.slice(colonIndex + 1).trim();
    headersList.push({ key, value, enabled: true });
  }
}

export function parseCurl(rawInput: string): ParsedCurl {
  if (!rawInput || !rawInput.trim()) {
    throw new Error('Please enter a cURL command');
  }

  let cleaned = rawInput.trim();
  cleaned = cleaned.replace(/^[$#>]\s+/, '');
  cleaned = cleaned.replace(/\\\r?\n/g, ' ').replace(/\^\r?\n/g, ' ');

  const tokens = tokenizeArgs(cleaned);

  if (tokens.length === 0 || tokens[0] !== 'curl') {
    throw new Error('Command must begin with "curl"');
  }

  let method: HttpMethod | undefined;
  let url = '';
  const headers: Array<{ key: string; value: string; enabled: boolean }> = [];
  const bodyParts: string[] = [];

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === '-X' || token === '--request') {
      if (i + 1 < tokens.length) {
        method = normalizeMethod(tokens[++i]);
      }
    } else if (token.startsWith('--request=')) {
      method = normalizeMethod(token.split('=', 2)[1]);
    } else if (token.startsWith('-X') && token.length > 2) {
      method = normalizeMethod(token.slice(2));
    } else if (token === '-H' || token === '--header') {
      if (i + 1 < tokens.length) {
        addHeader(tokens[++i], headers);
      }
    } else if (token.startsWith('--header=')) {
      addHeader(token.slice(9), headers);
    } else if (
      token === '-d' ||
      token === '--data' ||
      token === '--data-raw' ||
      token === '--data-ascii' ||
      token === '--data-binary' ||
      token === '--data-urlencode'
    ) {
      if (i + 1 < tokens.length) {
        bodyParts.push(tokens[++i]);
      }
    } else if (token.startsWith('--data=') || token.startsWith('--data-raw=')) {
      const parts = token.split('=', 2);
      bodyParts.push(parts[1] || '');
    } else if (token.startsWith('-d') && token.length > 2) {
      bodyParts.push(token.slice(2));
    } else if (token === '-u' || token === '--user') {
      if (i + 1 < tokens.length) {
        const userPass = tokens[++i];
        const encoded =
          typeof btoa === 'function' ? btoa(userPass) : Buffer.from(userPass).toString('base64');
        headers.push({ key: 'Authorization', value: `Basic ${encoded}`, enabled: true });
      }
    } else if (token.startsWith('--user=')) {
      const userPass = token.slice(7);
      const encoded =
        typeof btoa === 'function' ? btoa(userPass) : Buffer.from(userPass).toString('base64');
      headers.push({ key: 'Authorization', value: `Basic ${encoded}`, enabled: true });
    } else if (token === '-A' || token === '--user-agent') {
      if (i + 1 < tokens.length) {
        headers.push({ key: 'User-Agent', value: tokens[++i], enabled: true });
      }
    } else if (token === '-e' || token === '--referer') {
      if (i + 1 < tokens.length) {
        headers.push({ key: 'Referer', value: tokens[++i], enabled: true });
      }
    } else if (token === '--url') {
      if (i + 1 < tokens.length) {
        url = tokens[++i];
      }
    } else if (token.startsWith('--url=')) {
      url = token.slice(6);
    } else if (!url && !token.startsWith('-')) {
      url = token;
    }
  }

  if (!url) {
    throw new Error('No target URL found in cURL command');
  }

  let body = bodyParts.join('&');

  if (body) {
    try {
      const parsedJson = JSON.parse(body);
      body = JSON.stringify(parsedJson, null, 2);
    } catch {
      void 0;
    }
  }

  if (!method) {
    method = body ? 'POST' : 'GET';
  }

  return {
    url,
    method,
    headers: headers.length > 0 ? headers : [{ key: '', value: '', enabled: true }],
    body,
  };
}
