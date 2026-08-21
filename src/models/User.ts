import { ActivityLogEntry, type ActivityLogEntryProps } from "./ActivityLogEntry";

export type UserStatus = "Active" | "Inactive";

export interface UserProps {
  id?: string;
  userid: string;
  firstname: string;
  lastname: string;
  email: string;
  mobile: string;
  referencenumber: string;
  role: string;
  aadharnumber: string;
  pincode: string;
  supportedpincodes: string[];
  address: string;
  landmark: string;
  imageKeys: string[];
  privileges: string[];
  discountrate: number;
  bankname: string;
  accountno: string;
  ifsccode: string;
  status: UserStatus;
  activitylog: ActivityLogEntryProps[];
}

/** Properties that must always be present on a User model instance. */
export const USER_MODEL_KEYS = [
  "userid",
  "firstname",
  "lastname",
  "email",
  "mobile",
  "referencenumber",
  "role",
  "aadharnumber",
  "pincode",
  "supportedpincodes",
  "address",
  "landmark",
  "imageKeys",
  "privileges",
  "discountrate",
  "bankname",
  "accountno",
  "ifsccode",
  "status",
  "activitylog",
] as const satisfies ReadonlyArray<keyof UserProps>;

export type UserModelKey = (typeof USER_MODEL_KEYS)[number];

const assertHasModelProperty = (
  data: Partial<UserProps> | Record<string, unknown>,
  key: UserModelKey,
): void => {
  if (!Object.prototype.hasOwnProperty.call(data, key) || data[key] === undefined) {
    throw new Error(`User model missing required property: "${key}"`);
  }
};

const normalizeStatus = (value: unknown): UserStatus =>
  String(value || "Active").toLowerCase() === "inactive" ? "Inactive" : "Active";

const toStringArray = (raw: unknown): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((item) => String(item).trim()).filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // not JSON
    }
    return raw
      .split(/[,;\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const toActivityLog = (raw: unknown): ActivityLogEntryProps[] => {
  if (!raw) return [];
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      return [];
    }
  }
  return list.map((entry) =>
    ActivityLogEntry.fromApi(
      entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {},
    ).toJSON(),
  );
};

export class User {
  id?: string;
  userid: string;
  firstname: string;
  lastname: string;
  email: string;
  mobile: string;
  referencenumber: string;
  role: string;
  aadharnumber: string;
  pincode: string;
  supportedpincodes: string[];
  address: string;
  landmark: string;
  imageKeys: string[];
  privileges: string[];
  discountrate: number;
  bankname: string;
  accountno: string;
  ifsccode: string;
  status: UserStatus;
  activitylog: ActivityLogEntryProps[];

  constructor(data: UserProps) {
    for (const key of USER_MODEL_KEYS) {
      assertHasModelProperty(data, key);
    }

    if (data.id !== undefined && data.id !== null) {
      this.id = String(data.id);
    }

    this.userid = String(data.userid);
    this.firstname = String(data.firstname);
    this.lastname = String(data.lastname);
    this.email = String(data.email);
    this.mobile = String(data.mobile);
    this.referencenumber = String(data.referencenumber);
    this.role = String(data.role);
    this.aadharnumber = String(data.aadharnumber);
    this.pincode = String(data.pincode);
    this.supportedpincodes = Array.isArray(data.supportedpincodes)
      ? data.supportedpincodes.map(String)
      : [];
    this.address = String(data.address);
    this.landmark = String(data.landmark);
    this.imageKeys = Array.isArray(data.imageKeys) ? data.imageKeys.map(String) : [];
    this.privileges = Array.isArray(data.privileges) ? data.privileges.map(String) : [];
    this.discountrate = Number(data.discountrate) || 0;
    this.bankname = String(data.bankname ?? "");
    this.accountno = String(data.accountno ?? "");
    this.ifsccode = String(data.ifsccode ?? "");
    this.status = normalizeStatus(data.status);
    this.activitylog = Array.isArray(data.activitylog) ? data.activitylog : [];
  }

  /** Empty form defaults — every model property is present. */
  static createEmpty(): User {
    return new User({
      userid: "",
      firstname: "",
      lastname: "",
      email: "",
      mobile: "",
      referencenumber: "",
      role: "",
      aadharnumber: "",
      pincode: "",
      supportedpincodes: [],
      address: "",
      landmark: "",
      imageKeys: [],
      privileges: [],
      discountrate: 0,
      bankname: "",
      accountno: "",
      ifsccode: "",
      status: "Active",
      activitylog: [],
    });
  }

  /**
   * Build a User from an API / form payload.
   * Throws if any model property cannot be resolved from the source object.
   */
  static fromApi(raw: Record<string, unknown> | null | undefined): User {
    if (!raw || typeof raw !== "object") {
      throw new Error("User model requires an object");
    }

    const imageRaw = raw.imageKeys ?? [];

    const privilegesRaw = raw.privileges ?? [];
    let privileges: string[] = [];
    if (Array.isArray(privilegesRaw)) {
      privileges = privilegesRaw.filter(Boolean).map(String);
    } else if (typeof privilegesRaw === "string") {
      try {
        const parsed = JSON.parse(privilegesRaw);
        privileges = Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
      } catch {
        privileges = privilegesRaw ? [privilegesRaw] : [];
      }
    }

    const mapped: UserProps = {
      id: raw.id !== undefined && raw.id !== null ? String(raw.id) : undefined,
      userid: String(raw.userid ?? raw.userId ?? ""),
      firstname: String(raw.firstname ?? raw.firstName ?? ""),
      lastname: String(raw.lastname ?? raw.lastName ?? ""),
      email: String(raw.email ?? ""),
      mobile: String(raw.mobile ?? ""),
      referencenumber: String(raw.referencenumber ?? raw.referenceNumber ?? ""),
      role: String(raw.role ?? ""),
      aadharnumber: String(raw.aadharnumber ?? raw.aadharNumber ?? ""),
      pincode: String(raw.pincode ?? ""),
      supportedpincodes: toStringArray(
        raw.supportedpincodes ?? raw.supportedPincodes ?? raw.supported_pincodes,
      ),
      address: String(raw.address ?? ""),
      landmark: String(raw.landmark ?? ""),
      imageKeys: toStringArray(imageRaw),
      privileges,
      discountrate: Number(raw.discountrate ?? raw.discountRate ?? 0) || 0,
      bankname: String(raw.bankname ?? raw.bankName ?? ""),
      accountno: String(raw.accountno ?? raw.accountNo ?? raw.accountnumber ?? ""),
      ifsccode: String(raw.ifsccode ?? raw.ifscCode ?? ""),
      status: normalizeStatus(raw.status),
      activitylog: toActivityLog(raw.activitylog ?? raw.activityLog),
    };

    for (const key of USER_MODEL_KEYS) {
      assertHasModelProperty(mapped, key);
    }

    return new User(mapped);
  }

  toJSON(): UserProps {
    return {
      ...(this.id !== undefined ? { id: this.id } : {}),
      userid: this.userid,
      firstname: this.firstname,
      lastname: this.lastname,
      email: this.email,
      mobile: this.mobile,
      referencenumber: this.referencenumber,
      role: this.role,
      aadharnumber: this.aadharnumber,
      pincode: this.pincode,
      supportedpincodes: [...this.supportedpincodes],
      address: this.address,
      landmark: this.landmark,
      imageKeys: [...this.imageKeys],
      privileges: [...this.privileges],
      discountrate: this.discountrate,
      bankname: this.bankname,
      accountno: this.accountno,
      ifsccode: this.ifsccode,
      status: this.status,
      activitylog: this.activitylog.map((entry) => ({ ...entry })),
    };
  }

  toFormValues(): UserProps {
    return this.toJSON();
  }
}
