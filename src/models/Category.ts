export interface CategoryProps {
  id?: string;
  title: string;
  imageKey: string;
  isActive: boolean;
}

/** Properties that must always be present on a Category model instance. */
export const CATEGORY_MODEL_KEYS = [
  "title",
  "imageKey",
  "isActive",
] as const satisfies ReadonlyArray<keyof CategoryProps>;

export type CategoryModelKey = (typeof CATEGORY_MODEL_KEYS)[number];

const assertHasModelProperty = (
  data: Partial<CategoryProps> | Record<string, unknown>,
  key: CategoryModelKey,
): void => {
  if (!Object.prototype.hasOwnProperty.call(data, key) || data[key] === undefined) {
    throw new Error(`Category model missing required property: "${key}"`);
  }
};

const normalizeIsActive = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "false" || normalized === "0" || normalized === "inactive") {
      return false;
    }
    if (normalized === "true" || normalized === "1" || normalized === "active") {
      return true;
    }
  }
  if (typeof value === "number") return value !== 0;
  // Default to active when status is omitted (matches existing form behavior).
  return value == null ? true : Boolean(value);
};

export class Category {
  id?: string;
  title: string;
  imageKey: string;
  isActive: boolean;

  constructor(data: CategoryProps) {
    for (const key of CATEGORY_MODEL_KEYS) {
      assertHasModelProperty(data, key);
    }

    if (data.id !== undefined && data.id !== null) {
      this.id = String(data.id);
    }

    this.title = String(data.title);
    this.imageKey = String(data.imageKey ?? "");
    this.isActive = normalizeIsActive(data.isActive);
  }

  /** Empty form defaults — every model property is present. */
  static createEmpty(): Category {
    return new Category({
      title: "",
      imageKey: "",
      isActive: true,
    });
  }

  /**
   * Build a Category from an API / form payload.
   * Throws if the source is not an object or a required model property is missing after mapping.
   */
  static fromApi(raw: Record<string, unknown> | null | undefined): Category {
    if (!raw || typeof raw !== "object") {
      throw new Error("Category model requires an object");
    }

    const idSource = raw.id ?? raw.categoryId ?? raw.categoryid ?? raw.category_id;
    const mapped: CategoryProps = {
      id: idSource !== undefined && idSource !== null ? String(idSource) : undefined,
      title: String(raw.title ?? raw.name ?? ""),
      imageKey: String(raw.imageKey ?? ""),
      isActive: normalizeIsActive(raw.isActive ?? true),
    };

    for (const key of CATEGORY_MODEL_KEYS) {
      assertHasModelProperty(mapped, key);
    }

    return new Category(mapped);
  }

  toJSON(): CategoryProps {
    return {
      ...(this.id !== undefined ? { id: this.id } : {}),
      title: this.title,
      imageKey: this.imageKey,
      isActive: this.isActive,
    };
  }

  toFormValues(): CategoryProps {
    return this.toJSON();
  }

  /** Payload shape used by create/update category APIs. */
  toApiPayload(): { title: string; imageKey: string; isActive: boolean } {
    return {
      title: this.title.trim(),
      imageKey: this.imageKey,
      isActive: this.isActive,
    };
  }
}
