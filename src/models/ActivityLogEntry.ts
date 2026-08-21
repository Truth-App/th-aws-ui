export interface ActivityLogEntryProps {
  role: string;
  referencenumber: string;
  modifiedBy: string;
  modifiedAt: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
}

const ACTIVITY_LOG_REQUIRED_KEYS = [
  "role",
  "referencenumber",
  "modifiedBy",
  "modifiedAt",
] as const satisfies ReadonlyArray<keyof ActivityLogEntryProps>;

export class ActivityLogEntry {
  role: string;
  referencenumber: string;
  modifiedBy: string;
  modifiedAt: string;
  field?: string;
  oldValue?: string;
  newValue?: string;

  constructor(data: ActivityLogEntryProps) {
    for (const key of ACTIVITY_LOG_REQUIRED_KEYS) {
      if (data[key] === undefined || data[key] === null) {
        throw new Error(`ActivityLogEntry model missing required property: "${key}"`);
      }
    }

    this.role = String(data.role);
    this.referencenumber = String(data.referencenumber);
    this.modifiedBy = String(data.modifiedBy);
    this.modifiedAt = String(data.modifiedAt);
    if (data.field !== undefined) this.field = String(data.field);
    if (data.oldValue !== undefined) this.oldValue = String(data.oldValue);
    if (data.newValue !== undefined) this.newValue = String(data.newValue);
  }

  static fromApi(raw: Record<string, unknown> | null | undefined): ActivityLogEntry {
    if (!raw || typeof raw !== "object") {
      throw new Error("ActivityLogEntry model requires an object");
    }

    return new ActivityLogEntry({
      role: String(raw.role ?? ""),
      referencenumber: String(raw.referencenumber ?? raw.referenceNumber ?? ""),
      modifiedBy: String(raw.modifiedBy ?? raw.modifiedby ?? ""),
      modifiedAt: String(raw.modifiedAt ?? raw.modifiedat ?? ""),
      field: raw.field !== undefined ? String(raw.field) : undefined,
      oldValue:
        raw.oldValue !== undefined
          ? String(raw.oldValue)
          : raw.oldvalue !== undefined
            ? String(raw.oldvalue)
            : undefined,
      newValue:
        raw.newValue !== undefined
          ? String(raw.newValue)
          : raw.newvalue !== undefined
            ? String(raw.newvalue)
            : undefined,
    });
  }

  toJSON(): ActivityLogEntryProps {
    return {
      role: this.role,
      referencenumber: this.referencenumber,
      modifiedBy: this.modifiedBy,
      modifiedAt: this.modifiedAt,
      ...(this.field !== undefined ? { field: this.field } : {}),
      ...(this.oldValue !== undefined ? { oldValue: this.oldValue } : {}),
      ...(this.newValue !== undefined ? { newValue: this.newValue } : {}),
    };
  }
}
