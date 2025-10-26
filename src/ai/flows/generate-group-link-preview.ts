'use server';

/**
 * @fileOverview Generates a preview image for a WhatsApp group link using AI.
 *
 * - generateGroupLinkPreview - A function that generates the preview image.
 * - GenerateGroupLinkPreviewInput - The input type for the generateGroupLinkPreview function.
 * - GenerateGroupLinkPreviewOutput - The return type for the generateGroupLinkPreview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGroupLinkPreviewInputSchema = z.object({
  groupLinkTitle: z
    .string()
    .describe('The title of the WhatsApp group link.'),
  groupLinkDescription: z
    .string()
    .describe('The description of the WhatsApp group link.'),
});
export type GenerateGroupLinkPreviewInput = z.infer<
  typeof GenerateGroupLinkPreviewInputSchema
>;

const GenerateGroupLinkPreviewOutputSchema = z.object({
  previewImage: z
    .string()
    .describe(
      'A preview image for the WhatsApp group link, as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type GenerateGroupLinkPreviewOutput = z.infer<
  typeof GenerateGroupLinkPreviewOutputSchema
>;

export async function generateGroupLinkPreview(
  input: GenerateGroupLinkPreviewInput
): Promise<GenerateGroupLinkPreviewOutput> {
  return generateGroupLinkPreviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGroupLinkPreviewPrompt',
  input: {schema: GenerateGroupLinkPreviewInputSchema},
  output: {schema: GenerateGroupLinkPreviewOutputSchema},
  prompt: `You are an AI that generates preview images for WhatsApp group links.

  Create a visually appealing and informative image that represents the group link.
  The image should be relevant to the group's title and description.

  Group Link Title: {{{groupLinkTitle}}}
  Group Link Description: {{{groupLinkDescription}}}

  Output the image as a data URI in the following format: data:<mimetype>;base64,<encoded_data>.
  The image should be a square with a resolution of 512x512 pixels.
  Include the group name in the image. Add some effects to make it look attractive.
  Make sure it is family friendly.
  Avoid any depictions of violence.
  Return just the url.`,
});

const generateGroupLinkPreviewFlow = ai.defineFlow(
  {
    name: 'generateGroupLinkPreviewFlow',
    inputSchema: GenerateGroupLinkPreviewInputSchema,
    outputSchema: GenerateGroupLinkPreviewOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      prompt: prompt(input).prompt,
      model: 'googleai/imagen-4.0-fast-generate-001',
    });
    return {previewImage: media.url!};
  }
);
