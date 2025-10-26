'use server';

/**
 * @fileOverview Generates a preview image based on a group's title and description.
 *
 * - extractGroupInfoFromLink - A function that orchestrates the image generation.
 * - ExtractGroupInfoInput - The input type for the function.
 * - ExtractGroupInfoOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractGroupInfoInputSchema = z.object({
  title: z.string().describe('The title of the group.'),
  description: z.string().describe('The description of the group.'),
});
export type ExtractGroupInfoInput = z.infer<
  typeof ExtractGroupInfoInputSchema
>;

const ExtractGroupInfoOutputSchema = z.object({
  previewImage: z
    .string()
    .describe(
      'A preview image for the WhatsApp group, as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type ExtractGroupInfoOutput = z.infer<
  typeof ExtractGroupInfoOutputSchema
>;

export async function extractGroupInfoFromLink(
  input: ExtractGroupInfoInput
): Promise<ExtractGroupInfoOutput> {
  return extractGroupInfoFlow(input);
}

const extractGroupInfoFlow = ai.defineFlow(
  {
    name: 'extractGroupInfoFlow',
    inputSchema: ExtractGroupInfoInputSchema,
    outputSchema: ExtractGroupInfoOutputSchema,
  },
  async input => {
    const imageGenerationPrompt = `Create a visually appealing and informative image that represents a WhatsApp group based on its title and description.

Group Title: ${input.title}
Group Description: ${input.description}

The image should be a square with a resolution of 512x512 pixels. It should be relevant, attractive, and family-friendly.`;

    const {media} = await ai.generate({
      prompt: imageGenerationPrompt,
      model: 'googleai/imagen-4.0-fast-generate-001',
    });

    if (!media?.url) {
      throw new Error('Failed to generate preview image.');
    }

    return {
      previewImage: media.url,
    };
  }
);
