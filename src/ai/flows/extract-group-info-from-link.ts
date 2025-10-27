'use server';
// This file is no longer used and is kept to avoid breaking imports.
// The functionality has been moved to a server action that uses the link-preview-js library.

export async function extractGroupInfoFromLink(
  input: any
): Promise<any> {
  // This function is deprecated.
  // The new logic is in `src/app/actions.ts` using `getLinkPreview`.
  console.warn("`extractGroupInfoFromLink` is deprecated.");
  return {
    previewImage: 'https://picsum.photos/seed/deprecated/512/512'
  };
}
