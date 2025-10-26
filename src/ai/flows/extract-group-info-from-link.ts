'use server';

/**
 * @fileOverview Extracts information from a WhatsApp group link and generates a preview.
 *
 * - extractGroupInfoFromLink - A function that orchestrates the info extraction and image generation.
 * - ExtractGroupInfoInput - The input type for the function.
 * - ExtractGroupInfoOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractGroupInfoInputSchema = z.object({
  groupLink: z.string().describe('The WhatsApp group link.'),
});
export type ExtractGroupInfoInput = z.infer<
  typeof ExtractGroupInfoInputSchema
>;

const ExtractGroupInfoOutputSchema = z.object({
  title: z.string().describe('A suggested title for the group.'),
  description: z
    .string()
    .describe('A suggested, brief description for the group.'),
  previewImage: z
    .string()
    .describe(
      'A preview image for the WhatsApp group link, as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
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

const infoExtractionPrompt = ai.definePrompt({
  name: 'groupInfoExtractionPrompt',
  input: {schema: ExtractGroupInfoInputSchema},
  output: {
    schema: z.object({
      title: z.string(),
      description: z.string(),
    }),
  },
  prompt: `You are an expert at analyzing WhatsApp group links. Your task is to extract a concise and appealing title and a brief, one-sentence description from the provided group link.

  Group Link: {{{groupLink}}}
  
  Based on the link, generate a suitable title and description.
  If the link contains non-English text, translate the title and description to English.`,
});

const extractGroupInfoFlow = ai.defineFlow(
  {
    name: 'extractGroupInfoFlow',
    inputSchema: ExtractGroupInfoInputSchema,
    outputSchema: ExtractGroupInfoOutputSchema,
  },
  async input => {
    const {output: info} = await infoExtractionPrompt(input);
    if (!info) {
      throw new Error('Failed to extract group info.');
    }

    const imageGenerationPrompt = `Create a visually appealing and informative image that represents a WhatsApp group based on its title and description.

Group Title: ${info.title}
Group Description: ${info.description}

The image should be a square with a resolution of 512x512 pixels. It should be relevant, attractive, and family-friendly.`;

    const {media} = await ai.generate({
      prompt: imageGenerationPrompt,
      model: 'googleai/imagen-4.0-fast-generate-001',
    });

    if (!media?.url) {
      throw new Error('Failed to generate preview image.');
    }

    return {
      title: info.title,
      description: info.description,
      previewImage: media.url,
    };
  }
);
