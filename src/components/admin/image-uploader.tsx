
'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase/provider'; // Use the provider hook
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

type ImageUploaderProps = {
  currentImageUrl?: string | null;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
};

export function ImageUploader({
  currentImageUrl,
  onUploadComplete,
  onRemove,
}: ImageUploaderProps) {
  const { toast } = useToast();
  const { app } = useFirestore(); // Get the Firebase app instance
  const [isUploading, startUploading] = useTransition();
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !app) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    startUploading(async () => {
      try {
        const storage = getStorage(app);
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${file.name}`;
        const storageRef = ref(storage, `group-logos/${uniqueFileName}`);

        // Upload the file directly using the client SDK
        const snapshot = await uploadBytes(storageRef, file);
        
        // Get the public download URL
        const downloadUrl = await getDownloadURL(snapshot.ref);

        onUploadComplete(downloadUrl);
        toast({
          title: 'Success!',
          description: 'Image uploaded successfully.',
        });

      } catch (error: any) {
        console.error('Upload failed:', error);
        toast({
          title: 'Upload Failed',
          description: error.message || 'There was a problem uploading your image.',
          variant: 'destructive',
        });
        setPreviewUrl(currentImageUrl || null); // Revert preview on failure
      } finally {
        URL.revokeObjectURL(objectUrl); // Clean up memory
      }
    });
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onRemove();
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24 rounded-md border-2 border-dashed border-muted-foreground/50 flex items-center justify-center bg-muted/50">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Logo Preview"
            fill
            className="object-contain rounded-md"
          />
        ) : (
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
        )}
        {isUploading && (
           <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
           </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('logo-upload-input')?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Choose Image'}
        </Button>
        <Input
          id="logo-upload-input"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/gif, image/webp"
          disabled={isUploading}
        />
        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleRemoveImage}
            disabled={isUploading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
