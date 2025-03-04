import type {
  AuthModel,
  AuthStore,
  AuthStoreOptions,
  BaseAuthStore,
} from "pocketbase";

export type SyncAuthStoreOptions = {
  initial?: string;
  save: (serialized: string) => void | Promise<void>;
  clear: () => void | Promise<void>;
};

export class SyncAuthStore implements BaseAuthStore, AuthStore {
  private _store: SyncAuthStoreOptions;
  private _fetching = false;
  #queue: Array<() => void> = [];

  constructor(options: SyncAuthStoreOptions) {
    this._store = options;
    const serialized = options.initial || "";
    this._saveLocal(serialized);
  }

  get token(): string {
    try {
      const storedData = this._storageGet();
      return storedData ? JSON.parse(storedData).token : "";
    } catch (err) {
      console.error("@SyncAuthStore.token: ", err);
      return "";
    }
  }

  get model(): AuthModel | null {
    try {
      const storedData = this._storageGet();
      return storedData ? JSON.parse(storedData).model : null;
    } catch (err) {
      console.error("@SyncAuthStore.model: ", err);
      return null;
    }
  }

  get isValid(): boolean {
    return !!this.token && !!this.model?.verified;
  }

  save(token: string, model: AuthModel | null) {
    const data = JSON.stringify({
      token,
      model,
    });
    this._saveLocal(data);
    this._store.save(data);
    return data;
  }

  clear() {
    this._saveLocal("");
    this._store.clear();
  }

  loadFromCookie(cookie: string, key = "pb_auth") {
    const regex = new RegExp(
      "(?:^|;\\s*)" + encodeURIComponent(key) + "=([^;]*)",
      "g"
    );
    const match = cookie ? regex.exec(cookie) : null;
    if (match && match[1]) {
      const data = decodeURIComponent(match[1]);
      this._saveLocal(data);
    } else {
      this._saveLocal("");
    }
  }

  exportToCookie(
    options: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: string;
      domain?: string;
      path?: string;
      maxAge?: number;
    } = {}
  ) {
    const defaultOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      domain: "",
      path: "/",
      maxAge: 0,
    };

    const cookieOptions = { ...defaultOptions, ...options };
    const storedData = this._storageGet() || "";
    const cookieValue =
      encodeURIComponent("pb_auth") + "=" + encodeURIComponent(storedData);

    let cookieParts = [cookieValue];

    const addCookiePart = (name: string, value: any) => {
      if (value) {
        cookieParts.push(name + "=" + value);
      }
    };

    if (cookieOptions.sameSite)
      cookieParts.push("SameSite=" + cookieOptions.sameSite);
    if (cookieOptions.domain)
      cookieParts.push("Domain=" + cookieOptions.domain);
    if (cookieOptions.path) cookieParts.push("Path=" + cookieOptions.path);
    if (cookieOptions.maxAge)
      cookieParts.push("Max-Age=" + cookieOptions.maxAge);
    if (cookieOptions.httpOnly) cookieParts.push("HttpOnly");
    if (cookieOptions.secure) cookieParts.push("Secure");

    return cookieParts.join("; ");
  }

  private _saveLocal(serialized: string) {
    this._fetching = true;
    this._data = serialized;
    this._fetching = false;
  }

  private _storageGet() {
    return this._data || "";
  }

  private set _data(val: string) {
    this._val = val;
  }

  private get _data() {
    return this._val;
  }

  private _val: string = "";

  onChange(callback: () => void, fireImmediately = false): () => void {
    if (fireImmediately) {
      callback();
    }

    this.#queue.push(callback);

    return () => {
      this.#queue = this.#queue.filter((c) => c !== callback);
    };
  }
}
