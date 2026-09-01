/**
 * The art forms the marketplace covers, with the one-line description shown to
 * buyers and learners.
 *
 * The data itself is artForms.json so the seeding script and the application
 * read the same file. Holding the list in TypeScript meant a plain Node script
 * could not import it, and the alternative - a second copy inside the script -
 * is the kind of duplication that drifts silently.
 *
 * Categories still live in MongoDB; scripts/seed-categories.mjs upserts from
 * here, so the admin can reorder, deactivate and edit them afterwards.
 *
 * Slugs follow the convention already in the collection: a product category
 * uses the bare slug, a course category the same slug with "-course" appended.
 * `slug` is unique across the whole collection rather than per type, and that
 * suffix is how the existing rows already work around it.
 */
import groups from "./artForms.json";

export interface ArtForm {
    name: string;
    slug: string;
    description: string;
}

export interface ArtFormGroup {
    /** Shown as the filter label on the home page. */
    label: string;
    forms: ArtForm[];
}

export const ART_FORM_GROUPS: ArtFormGroup[] = groups as ArtFormGroup[];

/** Every art form, flattened, in the order the groups declare them. */
export const ART_FORMS: ArtForm[] = ART_FORM_GROUPS.flatMap((g) => g.forms);

/** The course-category slug for an art form. */
export const courseSlug = (slug: string) => `${slug}-course`;
